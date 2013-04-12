var express = require('express'),
    db = require('../db'),
    utils = require('../utils');
    
var app = module.exports = express();

app.get('/reader/api/0/stream/details', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
        
    var feeds = utils.parseFeeds(req.query.s);
    if (!feeds)
        return res.send(400, 'Error=InvalidStream');
        
    db.Feed.findOne({ feedURL: feeds[0] }).then(function(feed) {
        utils.respond(res, {
            subscribers: feed ? feed.numSubscribers : "-1", // TODO: format with commas
            velocity: "0.0", // TODO
            successfulCrawlTimeUsec: feed ? (feed.successfulCrawlTime || 0) * 1000 : -1,
            failedCrawlTimeUsec: feed ? (feed.failedCrawlTime || 0) * 1000 : -1,
            lastFailureWasParseFailure: (feed && feed.lastFailureWasParseFailure) || false,
            trendsCharts: {},
            feedUrl: feed ? feed.feedURL : feeds[0]
        });
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

// Helper function that checks if a list of streams contains any tags
function hasTagStreams(streams) {
    return streams && streams.some(function(stream) { 
        return stream.type === 'tag'; 
    });
}

app.get('/reader/api/0/stream/items/ids', function(req, res) {
    // validate input
    var streams = utils.parseStreams(req.query.s, req.user);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    // auth is not required for public streams (e.g. feeds)
    if (hasTagStreams(streams) && !utils.checkAuth(req, res))
        return;
        
    if (!/^[0-9]+$/.test(req.query.n))
        return res.send(400, 'Error=InvalidCount');
        
    if (req.query.ot && !/^[0-9]+$/.test(req.query.ot))
        return res.send(400, 'Error=InvalidTime');
        
    if (req.query.nt && !/^[0-9]+$/.test(req.query.nt))
        return res.send(400, 'Error=InvalidTime');
        
    if (req.query.r && !/^[no]$/.test(req.query.r))
        return res.send(400, 'Error=InvalidRank');
                
    var excludeTags = utils.parseTags(req.query.xt, req.user);
    if (req.query.xt && !excludeTags)
        return res.send(400, 'Error=InvalidTag');
    
    // load posts
    // TODO: merge + includeAllDirectStreamIds options
    db.postsForStreams(streams, {
        excludeTags: excludeTags,
        minTime: req.query.ot,
        maxTime: req.query.nt,
        sort: req.query.r === 'o' ? 'published' : '-published',
        limit: +req.query.n
    }).then(function(posts) {
        posts = posts.map(function(post) {
            return {
                id: post.shortID,
                directStreamIds: [], // TODO
                timestampUsec: 1000 * post.published
            };
        });
        
        utils.respond(res, {
            itemRefs: posts,
            continuation: 'TODO'
        });
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

app.get('/reader/api/0/stream/items/count', function(req, res) {
    // Google Reader only accepts a single stream
    // TODO: figure out what the `a` option does
    var streams = utils.parseStreams(req.query.s, req.user);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    // auth is not required for public streams (e.g. feeds)
    if (hasTagStreams(streams) && !utils.checkAuth(req, res))
        return;
    
    db.postsForStreams(streams, { count: true }).then(function(count) {
        res.send('' + count);
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

function generateFeed(posts, feed) {
    var items = posts.map(function(post) {
        var tags = post.tags.map(function(tag) {
            return tag.stringID;
        });
        
        return {
            crawlTimeMsec: '' + (+post.feed.successfulCrawlTime),
            timestampUsec: '' + (1000 * post.published),
            id: post.longID,
            categories: tags.concat(post.categories),
            title: post.title,
            published: post.published / 1000 | 0,
            updated: post.updated / 1000 | 0,
            alternate: [{
                href: post.url,
                type: 'text/html'
            }],
            content: {
                direction: 'ltr',
                content: post.body
            },
            author: post.author,
            likingUsers: [],
            comments: [],
            annotations: [],
            origin: {
                streamId: post.feed.stringID,
                title: post.feed.title,
                htmlUrl: post.feed.siteURL
            }
        };
    });
    
    // TODO: atom output
    return {
        direction: 'ltr',
        id: feed.id,
        title: feed.title,
        description: feed.description,
        continuation: feed.continuation,
        self: [{ href: feed.self }],
        alternate: feed.siteURL ? [{ href: feed.siteURL, type: 'text/html' }] : undefined,
        updated: feed.updated / 1000 | 0,
        items: items
    };
}

app.get('/reader/api/0/stream/contents/*', function(req, res) {
    // validate input
    var streams = utils.parseStreams(req.params[0], req.user);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    // auth is not required for public streams (e.g. feeds)
    if (hasTagStreams(streams) && !utils.checkAuth(req, res))
        return;
        
    if (req.query.n && !/^[0-9]+$/.test(req.query.n))
        return res.send(400, 'Error=InvalidCount');
        
    if (req.query.ot && !/^[0-9]+$/.test(req.query.ot))
        return res.send(400, 'Error=InvalidTime');
        
    if (req.query.nt && !/^[0-9]+$/.test(req.query.nt))
        return res.send(400, 'Error=InvalidTime');
        
    if (req.query.r && !/^[no]$/.test(req.query.r))
        return res.send(400, 'Error=InvalidRank');
        
    var excludeTags = utils.parseTags(req.query.xt, req.user);
    if (req.query.xt && !excludeTags)
        return res.send(400, 'Error=InvalidTag');
        
    // load posts
    db.postsForStreams(streams, {
        excludeTags: excludeTags,
        minTime: req.query.ot,
        maxTime: req.query.nt,
        sort: req.query.r === 'o' ? 'published' : '-published',
        limit: +req.query.n || 20,
        populate: 'feed'
    }).then(function(posts) {
        // Google Reader returns a 404 for unknown feeds
        if (posts.length === 0 && streams[0].type === 'feed')
            return res.send(404, 'Error=FeedNotFound');
        
        var isFeed = streams[0].type === 'feed';
        var value = streams[0].value;
        var feed = posts[0] && posts[0].feed;
        
        // TODO: atom output
        res.json(generateFeed(posts, {
            id:           isFeed ? feed.stringID     : 'user/' + req.user.id + '/' + value.type + '/' + value.name,
            title:        isFeed ? feed.title        : value.name,
            description:  isFeed ? feed.description  : undefined,
            siteURL:      isFeed ? feed.siteURL      : undefined,
            updated:      isFeed ? feed.lastModified : Date.now(),
            self:         utils.fullURL(req),
            continuation: 'TODO'
        }));
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

// the stream/items/contents API supports both GET and POST requests
function getItems(params, res) {
    var items = utils.parseItems(params.i);
    if (!items)
        return res.send(400, 'Error=InvalidItem');
        
    if (params.output && !/^(json|atom|atom-hifi)$/.test(params.output))
        return res.send(400, 'Error=InvalidOutput');
                
    db.Post
      .where('_id').in(items)
      .populate('feed tags')
      .then(function(posts) {
          // Google reader seems to take the feed info from the first item's feed
          res.json(generateFeed(posts, {
              id:       posts[0] ? posts[0].feed.stringID : undefined,
              title:    posts[0] ? posts[0].feed.title : 'Untitled Subscription',
              siteURL:  posts[0] && posts[0].feed.siteURL,
              updated:  posts[0] ? posts[0].feed.lastModified : Date.now(),
              self:     utils.fullURL(res.req)
          }));
      }, function(err) {
          if (err.name === 'CastError')
            return res.send(400, 'Error=InvalidItem');
          
          res.send(500, 'Error=Unknown');
      });
}

app.get('/reader/api/0/stream/items/contents', function(req, res) {
    getItems(req.query, res);
});

app.post('/reader/api/0/stream/items/contents', function(req, res) {
    getItems(req.body, res);
});