var express = require('express'),
    rsvp = require('rsvp'),
    db = require('../db'),
    utils = require('../utils'),
    kue = require('kue'),
    jobs = kue.createQueue();
    
var app = module.exports = express();

// Helper function to find a subscription in an array based on a feed
function findSubscription(subscriptions, feed) {
    if (!feed || !subscriptions)
        return null;
    
    for (var i = 0; i < subscriptions.length; i++) {
        if (String(subscriptions[i].feed) === feed.id)
            return subscriptions[i];
    }
    
    return null;
}

// Handlers for the subscription/edit actions
var actions = {
    subscribe: function(ctx, url) {    
        // Find or create feed for this URL
        return db.findOrCreate(db.Feed, { feedURL: url }).then(function(feed) {
            // If this feed was just added, start a high priority job to fetch it
            if (feed.numSubscribers === 0) {
                jobs.create('feed', { feedID: feed.id })
                    .priority('high')
                    .save()
            }
            
            // Find or add a Subscription for the feed
            var subscription = findSubscription(ctx.user.subscriptions, feed);
        
            if (!subscription) {
                subscription = new db.Subscription({ feed: feed });
                ctx.user.subscriptions.push(subscription);
            
                // Increment feed.numSubscribers if a subscription is added
                feed.numSubscribers++;
            }
        
            // Add/remove tags and update title
            if (ctx.title)
                subscription.title = ctx.title;
            
            return rsvp.all([    
                db.editTags(subscription, ctx.addTags, ctx.removeTags),
                feed.save()
            ]);
        });
    },

    unsubscribe: function(ctx, url) {
        // Find a feed for this URL
        return db.Feed.findOne({ feedURL: url }).then(function(feed) {
            var subscription = findSubscription(ctx.user.subscriptions, feed);
            if (!subscription) return;
        
            // Delete Subscription for this feed
            subscription.remove();
            feed.numSubscribers--;
        
            // If feed.numSubscribers is 0, delete feed
            if (feed.numSubscribers === 0)
                return feed.remove();
            else
                return feed.save();
        });
    },
    
    edit: function(ctx, url, callback) {
        // Find a feed for this URL
        return db.Feed.findOne({ feedURL: url }).then(function(feed) {
            // Find Subscription for this URL
            var subscription = findSubscription(ctx.user.subscriptions, feed);
            if (!subscription) return;
            
            // Update subscription.title if needed
            if (ctx.title)
                subscription.title = ctx.title;
                
            // Add/remove tags from subscription
            return db.editTags(subscription, ctx.addTags, ctx.removeTags);
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
        return ctx.user.save();
    }).then(function() {
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
        return req.user.save();
    }).then(function() {
        res.send('OK');
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

// lists all of the feeds a user is subscribed to
app.get('/reader/api/0/subscription/list', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
        
    req.user.populate('subscriptions.feed subscriptions.tags').then(function(user) {
        var subscriptions = user.subscriptions.map(function(subscription) {
            var categories = subscription.tags.map(function(tag) {
                // TODO: check whether this only includes tags of type 'label'
                return {
                    id: tag.stringID,
                    label: tag.name
                };
            });
            
            return {
                id: 'feed/' + subscription.feed.feedURL,
                title: subscription.title || subscription.feed.title || '(title unknown)',
                firstitemmsec: 0, // TODO
                sortid: subscription.sortID || 0,
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
    db.Feed.findOne({ feedURL: streams[0] }).then(function(feed) {
        // Find Subscription for this URL
        var subscription = findSubscription(req.user.subscriptions, feed);
        res.send('' + !!subscription);
    }, function(err) {
        res.send(500, 'Error=Unknown');
    });
});

app.get('/reader/api/0/subscription/export', function(req, res) {
    // TODO: export OPML
});

app.get('/reader/api/0/subscription/import', function(req, res) {
    // TODO: import OPML
});