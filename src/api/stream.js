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
    if (!utils.checkAuth(req, res))
        return;
    
    // validate input
    var streams = utils.parseStreams(req.query.s);
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
                
    var excludeTags = utils.parseTags(req.query.xt);
    if (req.query.xt && !excludeTags)
        return res.send(400, 'Error=InvalidTag');
    
    // load posts
    // TODO: merge + includeAllDirectStreamIds options
    db.postsForStreams(streams, {
        excludeTags: excludeTags,
        minTime: req.query.ot,
        maxTime: req.query.nt,
        sort: req.query.r === 'o' ? 'date' : '-date',
        limit: +req.query.n
    }).then(function(posts) {
        posts = posts.map(function(post) {
            return {
                id: post.shortID,
                directStreamIds: [], // TODO
                timestampUsec: 1000 * post.date
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
    
});

app.get('/reader/api/0/stream/items/contents', function(req, res) {
    
});