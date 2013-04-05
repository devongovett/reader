/*
 * This is the feed fetcher. It runs in the background continuously and stores
 * feed updates in the database.
 */

var db = require('./db'),
    Feed = db.Feed,
    Post = db.Post,
    kue = require('kue'),
    feedparser = require('feedparser')
    jobs = kue.createQueue();
    
var UPDATE_INTERVAL = 10 * 60 * 1000;
    
jobs.process('feed', 20, function(job, done) {
    Feed
    .findById(job.data.feedID)
    .populate('posts')
    .exec(function(err, feed) {
        if (err || !feed)
            return done(err);
            
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
                    date: post.date,
                    author: post.author,
                    commentsURL: post.comments,
                    categories: post.categories
                });
                
                feed.posts.push(post);
                
                waiting++;
                post.save(end);
            }
            
            // TODO: check for updates to existing posts
            
        });
        
        var waiting = 1;
        var parseError = false;
        function end(err) {
            if (!err && --waiting)
                return;
            
            if (err) {
                parser.removeAllListeners('article');
                feed.failedCrawlTime = new Date();
                feed.lastFailureWasParseFailure = parseError;
            } else {
                feed.successfulCrawlTime = new Date();
            }
            
            feed.save(function(feedError) {
                err || (err = feedError);
                
                // schedule the next fetch
                jobs.create('feed', { feedID: feed.id})
                    .delay(UPDATE_INTERVAL)
                    .save(function(jobError) {
                        done(err || jobError);
                    });
            });
        }
    
        parser.on('error', function(err) {
            parseError = true;
        });
        
        parser.on('end', end);
    });
});