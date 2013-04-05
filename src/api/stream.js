var express = require('express'),
    db = require('../db'),
    utils = require('../utils');
    
var app = module.exports = express();

app.get('/reader/api/0/stream/contents/*', function(req, res) {
    
});

app.get('/reader/api/0/stream/details', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
        
    var feeds = utils.parseFeeds(req.query.s);
    if (!feeds)
        return res.send(400, 'Error=InvalidStream');
        
    db.Feed.findOne({ feedURL: feeds[0] }).then(function(feed) {
        if (feed) {
            utils.respond(res, {
                subscribers: '' + feed.numSubscribers, // TODO: format with comma
                velocity: '0.0', // TODO
                successfulCrawlTimeUsec: (feed.successfulCrawlTime || 0) * 1000,
                failedCrawlTimeUsec: (feed.failedCrawlTime || 0) * 1000,
                lastFailureWasParseFailure: feed.lastFailureWasParseFailure || false,
                trendsCharts: {},
                feedUrl: feed.feedURL
            });
        } else {
            utils.respond(res, {
                subscribers: "-1",
                velocity: "0.0",
                successfulCrawlTimeUsec: -1,
                failedCrawlTimeUsec: -1,
                lastFailureWasParseFailure: false,
                trendsCharts: {},
                feedUrl: feeds[0]
            });
        }
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

app.get('/reader/api/0/stream/items/ids', function(req, res) {
    // TODO: auth not required for public streams (e.g. feeds)
    if (!utils.checkAuth(req, res))
        return;
    
    // validate input
    var streams = utils.parseStreams(req.query.s, req.user);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
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
    // TODO: auth not required for public streams (e.g. feeds)
    if (!utils.checkAuth(req, res))
        return;
        
    // Google Reader only accepts a single stream
    // TODO: figure out what the `a` option does
    var streams = utils.parseStreams(req.query.s, req.user);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    db.postsForStreams(streams, { count: true }).then(function(count) {
        res.send('' + count);
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
          if (posts.length === 0) {
              return res.json({
                  direction: 'ltr',
                  title: 'Untitled Subscription',
                  self: [{ href: res.req.protocol + '://' + res.req.headers.host + res.req.url }],
                  updated: Date.now(),
                  items: []
              });
          }
          
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
          // Google reader seems to take the feed info from the first item's feed
          res.json({
              direction: 'ltr',
              id: posts[0].feed.stringID,
              title: posts[0].feed.title,
              self: [{ href: res.req.protocol + '://' + res.req.headers.host + res.req.url }],
              alternate: [{
                  href: posts[0].feed.siteURL,
                  type: 'text/html'
              }],
              updated: posts[0].feed.lastModified / 1000 | 0,
              items: items
          });
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