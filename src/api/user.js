var express = require('express'),
    crypto = require('crypto'),
    db = require('../db'),
    utils = require('../utils');
    
var app = module.exports = express();

// simple ClientLogin API for now, though we should probably support OAuth too
// see https://developers.google.com/accounts/docs/AuthForInstalledApps
app.post('/accounts/ClientLogin', function(req, res) {
    res.type('text');
    req.session.authorized = false;
    req.session.user = null;
    req.session.token = null;
    
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
    res.type('text');
    
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

app.get('/reader/api/0/token', function(req, res) {
    res.type('text');
    
    if (!req.session.authorized)
        return res.status(401).send('Error=AuthRequired');
    
    crypto.randomBytes(24, function(err, buf) {
        if (err)
            return res.status(500).send('Error=Unknown');
            
        req.session.token = buf.toString('hex').slice(0, 24);
        res.send(req.session.token);
    });
});

app.get('/reader/api/0/user-info', function(req, res) {
    if (!req.session.authorized)
        return res.status(401).send('Error=AuthRequired');
        
    var user = req.session.user;
    utils.respond(res, {
        userId: user._id,
        userName: user.username.split('@')[0],
        userProfileId: user._id, // not sure how this is different from userId
        userEmail: user.username,
        isBloggerUser: false,
        signupTimeSec: Math.round(new Date(user.signupTime) / 1000),
        // publicUserName?
        isMultiLoginEnabled: false
    });
});