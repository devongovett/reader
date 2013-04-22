var express = require('express'),
    rsvp = require('rsvp'),
    xml = require('libxmljs'),
    fs = require('fs'),
    OPMLParser = require('opmlparser'),
    db = require('../db'),
    utils = require('../utils'),
    kue = require('kue'),
    jobs = kue.createQueue();
    
var app = module.exports = express();

// Handlers for the subscription/edit actions
var actions = {
    subscribe: function(ctx, url) {
        var feed = db.findOrCreate(db.Feed, { feedURL: url });
        var tag = db.findOrCreate(db.Tag, utils.parseTags('user/-/state/com.google/reading-list', ctx.user)[0]);
        
        // Find or create feed for this URL
        return rsvp.all([feed, tag]).then(function(results) {
            var feed = results[0], tag = results[1];
            
            // If this feed was just added, start a high priority job to fetch it
            if (feed.numSubscribers === 0) {
                jobs.create('feed', { feedID: feed.id })
                    .priority('high')
                    .save();
            }
            
            // Subscribe to the feed if the tag was not found
            if (!~feed.tags.indexOf(tag.id)) {
                feed.tags.addToSet(tag);
                feed.numSubscribers++;
            }
                        
            // Add/remove tags and update title
            if (ctx.title)
                feed.setTitleForUser(ctx.title, ctx.user);
                            
            return db.editTags(feed, ctx.addTags, ctx.removeTags).then(function() {
                return feed.save();
            });
        });
    },

    unsubscribe: function(ctx, url) {
        var feed = db.Feed.findOne({ feedURL: url });
        var tag = db.Tag.findOne(utils.parseTags('user/-/state/com.google/reading-list', ctx.user)[0]);
        
        // Find a feed for this URL
        return rsvp.all([feed, tag]).then(function(results) {
            var feed = results[0], tag = results[1];
            if (!tag || !feed) return;
            
            // remove the reading-list tag from the feed for this user
            if (~feed.tags.indexOf(tag.id)) {
                feed.tags.remove(tag);
                feed.numSubscribers--;
            }
            
            // If feed.numSubscribers is 0, delete feed
            if (feed.numSubscribers === 0)
                return feed.remove();
            else
                return feed.save();
        });
    },
    
    edit: function(ctx, url, callback) {
        var feed = db.Feed.findOne({ feedURL: url });
        var tag = db.Tag.findOne(utils.parseTags('user/-/state/com.google/reading-list', ctx.user)[0]);
        
        // Find a feed for this URL
        return rsvp.all([feed, tag]).then(function(results) {
            var feed = results[0], tag = results[1];
            
            // Make sure the user was actually subscribed to this feed
            if (!tag || !~feed.tags.indexOf(tag.id))
                return;
            
            // Update the title if needed
            if (ctx.title)
                feed.setTitleForUser(ctx.title, ctx.user);
                                
            // Add/remove tags
            return db.editTags(feed, ctx.addTags, ctx.removeTags).then(function() {
                return feed.save();
            });
        });
    }
};

// used to subscribe, unsubscribe, or edit tags for user feed subscriptions
app.post('/reader/api/0/subscription/edit', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    if (!actions.hasOwnProperty(req.body.ac))
        return res.send(400, 'Error=UnknownAction');
        
    // create a context used by the action functions (above)
    var ctx = {
        user: req.user,
        addTags: utils.parseTags(req.body.a, req.user),
        removeTags: utils.parseTags(req.body.r, req.user),
        title: req.body.t
    };
        
    // validate tags
    if (req.body.a && !ctx.addTags)
        return res.send(400, 'Error=InvalidTag');
        
    if (req.body.r && !ctx.removeTags)
        return res.send(400, 'Error=InvalidTag');
        
    // the `s` parameter can be repeated to edit multiple subscriptions simultaneously
    var streams = utils.parseFeeds(req.body.s);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    // bind the action function to the context
    var action = actions[req.body.ac].bind(null, ctx);
    
    // call the action function for each stream and then save the user
    rsvp.all(streams.map(action)).then(function() {
        res.send('OK');
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

app.post('/reader/api/0/subscription/quickadd', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    var streams = utils.parseFeeds(req.body.quickadd);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    actions.subscribe(req, streams[0]).then(function() {
        res.send('OK');
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

// lists all of the feeds a user is subscribed to
app.get('/reader/api/0/subscription/list', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
        
    // Find feeds the user is subscribed to
    req.user.feeds.then(function(feeds) {
        var subscriptions = feeds.map(function(feed) {
            var categories = feed.tagsForUser(req.user).map(function(tag) {
                return {
                    id: tag.stringID,
                    label: tag.name
                };
            });
            
            return {
                id: 'feed/' + feed.feedURL,
                title: feed.titleForUser(req.user),
                firstitemmsec: 0, // TODO
                sortid: feed.sortID,
                categories: categories
            };
        });
        
        utils.respond(res, {
            subscriptions: subscriptions
        });
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

// checks to see if a user is subscribed to a particular feed
app.get('/reader/api/0/subscribed', function(req, res) {
    var streams = utils.parseFeeds(req.query.s);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    // Find a feed for the first stream
    var tag = db.Tag.findOne(utils.parseTags('user/-/state/com.google/reading-list', req.user)[0]);
    
    tag.then(function(tag) {
        return db.Feed.count({ tags: tag, feedURL: streams[0] });
    }).then(function(count) {
        res.send('' + !!count);
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

app.get('/reader/subscriptions/export', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
        
    // Find feeds the user is subscribed to
    req.user.feeds.then(function(feeds) {        
        var doc = new xml.Document();
        var root = doc.node('opml').attr({ version: '1.0' });
        root.node('head').node('title', req.user.username.split('@')[0] + ' subscriptions');
        
        var body = root.node('body');
        var folders = {};
        
        // TODO: sort?
        
        feeds.forEach(function(feed) {
            var tags = feed.tagsForUser(req.user),
                title = feed.titleForUser(req.user);
                
            var attrs = {
                text: title,
                title: title,
                type: 'rss',
                xmlUrl: feed.feedURL,
                htmlUrl: feed.siteURL                    
            };
            
            if (tags.length === 0) {
                body.node('outline').attr(attrs);
            } else {
                tags.forEach(function(tag) {
                    if (tag.type !== 'label')
                        return;
                
                    if (!folders[tag.name]) {
                        folders[tag.name] = body.node('outline').attr({
                            title: tag.name,
                            text: tag.name
                        });
                    }
                    
                    folders[tag.name].node('outline').attr(attrs);
                });
            }
        });
        
        res.attachment('google-reader-subscriptions.xml')
           .type('text/xml; charset=UTF-8')
           .send(doc.toString());
        
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

app.post('/reader/subscriptions/import', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;

    if (req.body.action !== 'opml-upload')
        return res.send(400, 'Error=UnknownAction');

    if (!req.files['opml-file'])
        return res.send(400, 'Error=MissingFile');

    fs.createReadStream(req.files['opml-file'].path)
        .pipe(new OPMLParser({ addmeta: false }))
        .on('error', function(error) {
            res.send(400, 'Error=Unknown');
        })
        .on('outline', function(outline) {
            if (!Array.isArray(outline))
                return res.send('OK');

            var subscriptions = [];
            outline.forEach(function(item) {
                // if this is a feed that isn't in a folder, add it directly
                if (!item.outline) {
                    subscriptions.push(actions.subscribe({
                        user: req.user,
                        title: item.title
                    }, item.xmlurl));
                    return;
                }
                
                // otherwise, add the items in the folder
                item.outline.forEach(function(feed) {
                    if (feed.type !== 'rss' || !utils.isUrl(feed.xmlurl))
                        return;
                        
                    subscriptions.push(actions.subscribe({
                        user: req.user,
                        addTags: [{ user: req.user, type: 'label', name: feed.folder }],
                        title: feed.title
                    }, feed.xmlurl));
                });
            });

            rsvp.all(subscriptions).then(function() {
                res.send('OK');
            }, function(err) {
                res.send(500, 'Error=Unknown');
            });
        });
});
