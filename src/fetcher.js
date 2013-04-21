/*
 * This is the feed fetcher. It runs in the background continuously and stores
 * feed updates in the database.
 */

var db = require('./db'),
    Feed = db.Feed,
    Post = db.Post,
    kue = require('kue'),
    feedparser = require('feedparser'),
    rsvp = require('rsvp');
    
const UPDATE_INTERVAL = 10 * 60 * 1000;
const PARALLEL_JOBS = 20;

// connect to the database
db.connect();

// setup the job queue
var jobs = kue.createQueue();
jobs.promote();
    
jobs.process('feed', PARALLEL_JOBS, function(job, done) {
    Feed
    .findById(job.data.feedID)
    .populate('posts')
    .then(function(feed) {
        if (!feed) return done();
            
        var existingPosts = {};
        feed.posts.forEach(function(post) {
            existingPosts[post.guid] = post;
        });
        
        var parser = feedparser.parseUrl({
            url: feed.feedURL,
            headers: {
                'If-Modified-Since': feed.lastModified,
                'If-None-Match': feed.etag
            }
        });
    
        parser.on('response', function(res) {
            feed.lastModified = res.headers['last-modified'];
            feed.etag = res.headers.etag;
        });
    
        parser.on('meta', function(meta) {
            feed.title = meta.title;
            feed.description = meta.description;
            feed.author = meta.author;
            feed.language = meta.language;
            feed.copywrite = meta.copywrite;
            feed.categories = meta.categories;
            
            if (meta.xmlurl)
                feed.feedURL = meta.xmlurl;
                
            feed.siteURL = meta.link;
            
            switch (meta.cloud.type) {
                case 'hub':      // pubsubhubbub supported
                case 'rsscloud': // rsscloud supported
                // TODO
            }
        });
        
        var posts = [];
        parser.on('article', function(post) {
            var guid = post.guid || post.link;
            
            if (!existingPosts[guid]) {
                var post = new Post({
                    feed: feed,
                    guid: guid,
                    title: post.title,
                    body: post.description,
                    summary: post.summary !== post.description ? post.summary : null,
                    url: post.link,
                    published: post.pubdate,
                    updated: post.date,
                    author: post.author,
                    commentsURL: post.comments,
                    categories: post.categories
                });
                
                feed.posts.push(post);
                posts.push(post.save());
            }
            
            // TODO: check for updates to existing posts
            
        });
        
        var parseError = false;
        parser.on('error', function(err) {
            parseError = true;
        });
        
        parser.on('end', function() {            
            // wait for posts to finish saving
            // then mark crawl success or failure
            rsvp.all(posts).then(function() {
                feed.successfulCrawlTime = new Date();
            }, function(err) {
                parser.removeAllListeners('article');
                feed.failedCrawlTime = new Date();
                feed.lastFailureWasParseFailure = parseError;
            }).then(function() {
                // save the feed and create a new job
                var feedPromise = feed.save();
                var jobPromise = new rsvp.Promise;
                
                // schedule the next feed update
                jobs.create('feed', { feedID: feed.id})
                    .delay(UPDATE_INTERVAL)
                    .save(function(err) {
                        if (err)
                            jobPromise.reject(err);
                        else
                            jobPromise.resolve();
                    });
                
                return rsvp.all([
                    feedPromise,
                    jobPromise
                ]);
            }).then(function() {
                done();
            }, done);
        });
    }, done);
});