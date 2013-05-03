var express = require('express'),
    db = require('../db'),
    utils = require('../utils');
    
var app = module.exports = express();

// simple ClientLogin API for now, though we should probably support OAuth too
// see https://developers.google.com/accounts/docs/AuthForInstalledApps
// and http://code.google.com/p/google-reader-api/wiki/Authentication
app.post('/accounts/ClientLogin', function(req, res) {
    if (!req.body.Email || !req.body.Passwd)
        return res.send(403, 'Error=BadAuthentication\n');
    
    db.User.findOne({ username: req.body.Email }, function(err, user) {
        if (err || !user)
            return res.send(403, 'Error=BadAuthentication\n');
            
        user.checkPassword(req.body.Passwd, function(err, matched) {
            if (err || !matched)
                return res.send(403, 'Error=BadAuthentication\n');
                
            req.session = {
                user: user.id
            };
            
            // clients *should* only care about Auth, but we'll include all
            // of Google's fields just in case
            res.write('SID=' + req.session.id + '\n');
            res.write('LSID=' + req.session.id + '\n');
            res.write('Auth=' + req.session.id + '\n');
            res.end();
        });
    });
});

// our own registration API
app.post('/accounts/register', function(req, res) {
    var user = new db.User({
        username: req.body.Email,
        password: req.body.Passwd
    });
    
    user.save(function(err) {
        if (err && err.name == 'MongoError') {
            if (err.code == 11000)
                res.send(400, 'Error=DuplicateUser');
            else
                res.send(500, 'Error=Unknown');
                
        } else if (err && err.name == 'ValidationError') {
            res.send(400, 'Error=BadRequest');
            
        } else {
            res.send('OK');
        }        
    });
});

app.get('/reader/api/0/token', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
    
    req.session.token = utils.uid(24);
    req.session.tokenExpiry = Date.now() + 30 * 60 * 1000; // token expires in 30 minutes
    res.send(req.session.token);
});

app.get('/reader/api/0/user-info', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
        
    var user = req.user;
    utils.respond(res, {
        userId: user.id,
        userName: user.username.split('@')[0],
        userProfileId: user.id, // not sure how this is different from userId
        userEmail: user.username,
        isBloggerUser: false,
        signupTimeSec: Math.round(user.signupTime / 1000),
        // publicUserName?
        isMultiLoginEnabled: false
    });
});