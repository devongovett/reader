var express = require('express'),
    rsvp = require('rsvp'),
    db = require('../db'),
    utils = require('../utils');
    
var app = module.exports = express();

app.get('/reader/api/0/tag/list', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
    
    db.Tag.find({ user: req.user }).then(function(tags) {
        var ret = [];
        tags.forEach(function(tag) {
            if (!(tag.type == 'state' && tag.tag == 'com.google/reading-list')) {
                ret.push({
                    id: tag.stringID,
                    sortID: tag.sortID || 0 // TODO
                });
            }
        });
        
        utils.respond(res, {
            tags: ret
        });
    }, function(err) {
        res.send(500, 'Error=Unknown');
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
    db.Post.where('_id').in(items).then(function(posts) {
        return rsvp.all(posts.map(function(post) {
            return db.editTags(post, addTags, removeTags).then(function() {
                return post.save();
            });
        }));
    }).then(function() {
        res.send('OK');
    }, function(err) {
        res.send(500, 'Error=Unknown');
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
    db.Tag.update(source[0], dest[0]).then(function() {
        res.send('OK');
    }, function(err) {
        return res.send(500, 'Error=Unknown');
    });
});

app.post('/reader/api/0/disable-tag', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    var tag = utils.parseTags(req.body.s, req.user);
    if (!tag)
        return res.send(400, 'Error=InvalidStream');
        
    db.Tag.findOneAndRemove(tag[0]).then(function(tag) {            
        if (tag) {
            // remove references to this tag from subscriptions and posts
            return rsvp.all([
                db.Feed.update({}, { $pull: { tags: tag }}),
                db.Post.update({}, { $pull: { tags: tag }})
            ]);
        }
    }).then(function() {
        res.send('OK');
    }, function(err) {
        res.send(500, 'Error=Unknown');
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
    
    // Get all of the posts in the stream
    // Google Reader appears to only accept a single stream
    var tag = db.findOrCreate(db.Tag, tag);
    var posts = db.postsForStream(streams[0]);
    
    rsvp.all([tag, posts]).then(function(results) {
        var tag = results[0], posts = results[1];
        
        // Add the tag to each of them
        return rsvp.all(posts.map(function(post) {
            post.tags.addToSet(tag);
            return post.save();
        }));
    }).then(function() {
        res.send('OK');
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

app.get('/reader/api/0/unread-count', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
        
    var tag = utils.parseTags('user/-/state/com.google/read', req.user)[0];
    
    var ret = {
        max: 1000, // is there a way to change this?
        unreadcounts: []
    };

    var tags = {};
    var total = 0;
    
    rsvp.all([
        db.Tag.findOne(tag),
        req.user.feeds
    ]).then(function(results) {
        var tag = results[0], feeds = results[1];
        
        return rsvp.all(feeds.map(function(feed) {
            return db.Post
              .count({ _id: { $in: feed.posts }, tags: { $ne: tag }})
              .limit(1000)
              .then(function(count) {
                  if (count === 0) return;
                  
                  ret.unreadcounts.push({
                      id: feed.stringID,
                      count: count,
                      newestItemTimestampUsec: 0 // TODO
                  });
                  
                  feed.tagsForUser(req.user).forEach(function(tag) {
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
                  
                  total += count;
              });
        }));
    }).then(function() {
        ret.unreadcounts.push({
            id: 'user/' + req.user.id + '/state/com.google/reading-list',
            count: total,
            newestItemTimestampUsec: 0 // TODO
        });
        
        utils.respond(res, ret);
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});
