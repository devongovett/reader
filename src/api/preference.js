var express = require('express'),
    db = require('../db'),
    utils = require('../utils');
    
var app = module.exports = express();

app.get('/reader/api/0/preference/list', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
    
    db.Preference.find({
        user: req.user,
        stream: null
    }).then(function(prefs) {
        prefs = prefs.map(function(pref) {
            return {
                id: pref.key,
                value: pref.value
            };
        });
        
        utils.respond(res, {
            prefs: prefs
        });
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

app.post('/reader/api/0/preference/set', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    if (!req.body.k)
        return res.send(400, 'Error=InvalidKey');
        
    if (!req.body.v)
        return res.send(400, 'Error=InvalidValue');
        
    db.updateOrCreate(db.Preference, {
        user: req.user,
        stream: null,
        key: req.body.k
    }, {
        value: req.body.v
    }).then(function() {
        res.send('OK');
    }, function() {
        res.send(500, 'Error=Unknown');
    });
});

app.get('/reader/api/0/preference/stream/list', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
    
    db.Preference.find({
        user: req.user,
        stream: { $ne: null }
    }).then(function(prefs) {
        var streamPrefs = Object.create(null);
        prefs.forEach(function(pref) {
            if (!streamPrefs[pref.stream])
                streamPrefs[pref.stream] = [];
                
            streamPrefs[pref.stream].push({
                id: pref.key,
                value: pref.value
            });
        });
        
        utils.respond(res, {
            streamprefs: streamPrefs
        });
        
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

app.post('/reader/api/0/preference/stream/set', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    var streams = utils.parseStreams(req.body.s, req.user);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    if (!req.body.k)
        return res.send(400, 'Error=InvalidKey');
        
    if (!req.body.v)
        return res.send(400, 'Error=InvalidValue');
        
    var stream;
    if (streams[0].type === 'feed')
        stream = 'feed/' + streams[0].value;
    else
        stream = 'user/' + req.user.id + '/' + streams[0].value.type + '/' + streams[0].value.name;
    
    db.updateOrCreate(db.Preference, {
        user: req.user,
        stream: stream,
        key: req.body.k
    }, {
        value: req.body.v
    }).then(function() {
        res.send('OK');
    }, function() {
        res.send(500, 'Error=Unknown');
    });
});