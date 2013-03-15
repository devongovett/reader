/*
 * This is the actual API endpoint that clients connect to
 */

var API_ROOT = '/reader/api/0/';
var PORT = 3000;

/*
    /stream/contents/user
    /stream/contents/feed
    /stream/details
    /stream/items/ids
    /stream/items/count
    /stream/items/contents

    /subscription/edit
    /subscription/list
    /subscription/export
    /subscribed

    /token
    /user-info

    /unread-count
    /mark-all-as-read

    /tag/list
    /rename-tag
    /edit-tag
    /disable-tag
*/

var db = require('./db');
var express = require('express');
var app = express();

app.use(express.bodyParser());

// simple ClientLogin API for now, though we should probably support OAuth too
app.post('/accounts/ClientLogin', function(req, res) {
    
});

// our own registration API
app.post('/accounts/register', function(req, res) {
    
});

app.get(API_ROOT + '/stream/contents/user/:userID/*', function(req, res) {
    res.json({ userID: req.params.userID, tag: req.params[0], query: req.query });
});

app.get(API_ROOT + '/stream/contents/feed/*', function(req, res) {
    res.json({ url: req.params[0], query: req.query });
});

app.get(API_ROOT + '/stream/details', function(req, res) {
    // req.query
});

app.get(API_ROOT + '/stream/items/ids', function(req, res) {
    // req.query
});

app.get(API_ROOT + '/stream/items/count', function(req, res) {
    
});

app.get(API_ROOT + '/stream/items/contents', function(req, res) {
    
});

app.post(API_ROOT + '/subscription/edit', function(req, res) {
    db.Feed.findOne({ feedURL: req.post.s }, function(err, feed) {
        if (!feed) {
            // fetch
        }
        
        user.subscriptions.findOne({ feed: feed._id }, function(err, subscription) {
            if (!subscription) {
                subscription = new db.Subscription({
                    title: req.post.t or feed.title,
                    feed: feed._id,
                    items: []
                });
            }
        });
    });
});

app.listen(PORT);
console.log('Started server on port ' + PORT);