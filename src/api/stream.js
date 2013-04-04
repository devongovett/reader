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
    
});

app.get('/reader/api/0/stream/items/count', function(req, res) {
    
});

app.get('/reader/api/0/stream/items/contents', function(req, res) {
    
});