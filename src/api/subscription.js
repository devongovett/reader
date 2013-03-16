var express = require('express'),
    db = require('../db'),
    utils = require('../utils');
    
var app = module.exports = express();

app.post('/reader/api/0/subscription/edit', function(req, res) {
    if (!req.session.authorized)
        return res.status(401).send('Error=AuthRequired');
    
    db.Feed.findOne({ feedURL: req.post.s }, function(err, feed) {
        if (!feed) {
            // fetch
        }
        
        user.subscriptions.findOne({ feed: feed._id }, function(err, subscription) {
            if (!subscription) {
                subscription = new db.Subscription({
                    title: req.post.t || feed.title,
                    feed: feed._id,
                    items: []
                });
            }
        });
    });
});

app.get('/reader/api/0/subscription/list', function(req, res) {
    
});

app.get('/reader/api/0/subscription/export', function(req, res) {
    
});

app.get('/reader/api/0/subscribed', function(req, res) {
    
});