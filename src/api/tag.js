var express = require('express'),
    db = require('../db'),
    utils = require('../utils');
    
var app = module.exports = express();

app.get('/reader/api/0/tag/list', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
    
    db.Tag.find({ user: req.user }, function(err, tags) {
        if (err)
            return res.send(500, 'Error=Unknown');
            
        tags = tags.map(function(tag) {
            return {
                id: tag.stringID,
                sortID: tag.sortID || 0 // TODO
            };
        });
            
        utils.respond(res, {
            tags: tags
        });
    });
});

app.get('/reader/api/0/edit-tag', function(req, res) {
    
});

app.get('/reader/api/0/rename-tag', function(req, res) {
    
});

app.get('/reader/api/0/disable-tag', function(req, res) {
    
});