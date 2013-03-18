var express = require('express'),
    Validator = require('validator').Validator,
    db = require('../db'),
    utils = require('../utils'),
    feeder = require('../feeder/feeder');
    
var app = module.exports = express();

// prevent validator from throwing errors, and instead return false on error
// FIXME: there has to be a better way to do this
var validator = new Validator;
validator.error = function() { return false; }

app.post('/reader/api/0/subscription/edit', function(req, res) {
    if (!req.user)
        return res.send(401, 'Error=AuthRequired');
            
    if (req.body.T !== req.session.token)
        return res.send(400, 'Error=InvalidToken');
        
    if (!req.body.s)
        return res.send(400, 'Error=MissingStream');
        
    if (!/^feed\//.test(req.body.s) || !validator.check(req.body.s.slice(5)).isUrl())
        return res.send(400, 'Error=InvalidStream');
        
    var tags;
    if (req.body.a && !(tags = utils.parseTags(req.body.a, req.user.id)))
        return res.send(400, 'Error=InvalidTag');
        
    switch (req.body.ac) {
        case 'subscribe':
        
        case 'unsubscribe':
        
        case 'edit':
        
        default:
            return res.send(400, 'Error=UnknownAction');
    }
    
    res.send('OK');
});

app.get('/reader/api/0/subscription/list', function(req, res) {
    
});

app.get('/reader/api/0/subscription/export', function(req, res) {
    
});

app.get('/reader/api/0/subscribed', function(req, res) {
    
});