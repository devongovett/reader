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
        
    var streams = utils.parseFeeds(req.body.s);
    if (req.body.s && !streams)
        return res.send(400, 'Error=InvalidStream');
    
    if (streams && streams.length !== items.length)
        return res.send(400, 'Error=UnknownCount');
        
    var addTags = utils.parseTags(req.body.a, req.user);
    var removeTags = utils.parseTags(req.body.r, req.user);
    
    // TODO: use streams to filter
    db.Post.where('_id').in(items).exec(function(err, posts) {
        if (err)
            return res.send(500, 'Error=Unknown');
            
        async.each(posts, function(post, next) {
            db.editTags(post, addTags, removeTags, function(err) {
                if (err)
                    return next(err);
                    
                post.save(next);
            });
        }, function(err) {
            if (err)
                return res.send(500, 'Error=Unknown');
                
            res.send('OK');
        });
    });
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

app.post('/reader/api/0/mark-all-as-read', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    var streams = utils.parseStreams(req.body.s, req.user);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
    
    // Find or create the read state tag
    var tag = utils.parseTags('user/-/state/com.google/read', req.user)[0];
    
    db.findOrCreate(db.Tag, tag, function(err, tag) {
        if (err)
            return res.send(500, 'Error=Unknown');
        
        // Get all of the posts in the stream
        // Google Reader appears to only accept a single stream
        db.postsForStream(streams[0], function(err, posts) {
            if (err)
                return res.send(500, 'Error=Unknown');
            
            // Add the tag to each of them
            async.each(posts, function(post, next) {
                post.tags.addToSet(tag);
                post.save(next);
            }, function(err) {
                if (err)
                    return res.send(500, 'Error=Unknown');
    
                res.send('OK');
            });            
        });
    });
});

app.get('/reader/api/0/unread-count', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
        
    var tag = utils.parseTags('user/-/state/com.google/read', req.user)[0];
    db.Tag.findOne(tag, function(err, tag) {
        if (err)
            return res.send(500, 'Error=Unknown');
        
        req.user.populate('subscriptions.feed subscriptions.tags', function(err, user) {
            if (err)
                return res.send(500, 'Error=Unknown');
            
            var ret = {
                max: 1000, // is there a way to change this?
                unreadcounts: []
            };
            
            var tags = {};
            var total = 0;
            
            // for each subscription, count the posts NOT containing the user/-/state/com.google/read tag
            async.each(user.subscriptions, function(subscription, next) {
                db.Post
                  .where('_id').in(subscription.feed.posts)
                  .and({ tags: { $ne: tag }})
                  .limit(1000)
                  .count(function(err, count) {
                      if (count > 0) {
                          ret.unreadcounts.push({
                              id: subscription.feed.stringID,
                              count: count,
                              newestItemTimestampUsec: 0 // TODO
                          });
                          
                          subscription.tags.forEach(function(tag) {
                              if (!tags[tag.stringID]) {
                                  tags[tag.stringID] = {
                                      id: tag.stringID,
                                      count: 0,
                                      newestItemTimestampUsec: 0 // TODO
                                  };
                                  
                                  ret.unreadcounts.push(tags[tag.stringID]);
                              }
                                                                
                              tags[tag.stringID].count += count;
                          });
                      }
                      
                      total += count;
                      next(err);
                  });
            }, function(err) {
                if (err)
                    return res.send(500, 'Error=Unknown');
                
                ret.unreadcounts.push({
                    id: 'user/' + req.user.id + '/state/com.google/reading-list',
                    count: total,
                    newestItemTimestampUsec: 0 // TODO
                });
                    
                utils.respond(res, ret);
            });
        });
    });
});