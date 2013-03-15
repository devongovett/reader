/*
 * This is the actual API endpoint that clients connect to
 */

var API_ROOT = '/reader/api/0/';
var SECRET = 'gobbledygook';
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
app.use(express.cookieParser(SECRET));
app.use(express.session({ key: 'SID' }));

// simple ClientLogin API for now, though we should probably support OAuth too
// see https://developers.google.com/accounts/docs/AuthForInstalledApps
app.post('/accounts/ClientLogin', function(req, res) {
    db.User.findOne({ username: req.body.Email }, function(err, user) {
        if (err || !user)
            return res.status(403).send('Error=BadAuthentication');
            
        user.checkPassword(req.body.Passwd, function(err, matched) {
            if (err || !matched)
                return res.status(403).send('Error=BadAuthentication');
            
            req.session.authorized = true;
            req.session.user = user;
            req.session.token = null;
            
            // clients *should* only care about SID, but we'll include all
            // of Google's fields just in case
            res.write('SID=' + req.sessionID + '\n');
            res.write('LSID=' + req.sessionID + '\n');
            res.write('Auth=' + req.sessionID + '\n');
            res.end();
        })
    });
});

// our own registration API (temporary?)
app.post('/accounts/register', function(req, res) {
    var user = new db.User({
        username: req.body.Email, // TODO: validate email address
        password: req.body.Passwd
    });
    
    user.save(function(err) {
        if (err && err.name == 'MongoError') {
            if (err.code == 11000)
                res.status(400).send('Error=DuplicateUser');
            else
                res.status(500).send('Error=Unknown');
                
        } else if (err && err.name == 'ValidationError') {
            res.status(400).send('Error=BadRequest');
            
        } else {
            res.send('OK');
        }        
    });
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
                    title: req.post.t || feed.title,
                    feed: feed._id,
                    items: []
                });
            }
        });
    });
});

app.listen(PORT);
console.log('Started server on port ' + PORT);