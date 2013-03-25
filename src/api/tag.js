var express = require('express'),
    async = require('async'),
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

app.post('/reader/api/0/edit-tag', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    var items = utils.parseItems(req.body.i);
    if (!items)
        return res.send(400, 'Error=InvalidItem');
        
    var streams = utils.parseStreams(req.body.s);
    if (req.body.s && !streams)
        return res.send(400, 'Error=InvalidStream');
    
    if (streams.length !== items.length)
        return res.send(400, 'Error=UnknownCount');
        
    var addTags = utils.parseTags(req.body.a, req.user);
    var removeTags = utils.parseTags(req.body.r, req.user);
    
    return res.send('OK');
});

app.post('/reader/api/0/rename-tag', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    var source = utils.parseTags(req.body.s, req.user);
    var dest = utils.parseTags(req.body.dest, req.user);
    
    if (!source || !dest)
        return res.send(400, 'Error=InvalidStream');
        
    // TODO: if dest is another existing tag, the tags need to be merged
    db.Tag.update(source[0], dest[0], function(err) {
        if (err)
            return res.send(500, 'Error=Unknown');
            
        res.send('OK');
    });
});

app.post('/reader/api/0/disable-tag', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    var tag = utils.parseTags(req.body.s, req.user);
    if (!tag)
        return res.send(400, 'Error=InvalidStream');
        
    db.Tag.findOneAndRemove(tag[0], function(err, tag) {
        if (err)
            return res.send(500, 'Error=Unknown');
            
        if (tag) {
            // remove references to this tag from subscriptions and posts
            req.user.subscriptions.forEach(function(sub) {
                sub.tags.remove(tag);
            });
            
            async.parallel([
                req.user.save.bind(req.user),
                db.Post.update.bind(db.Post, {}, { $pull: { tags: tag }})
            ], function(err) {
                if (err)
                    return res.send(500, 'Error=Unknown');
                
                res.send('OK');
            })
        } else {
            res.send('OK');
        }
    });
});