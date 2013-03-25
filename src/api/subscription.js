var express = require('express'),
    async = require('async'),
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
    subscribe: function(ctx, url, callback) {    
        // Find or create feed for this URL
        db.findOrCreate(db.Feed, { feedURL: url }, function(err, feed) {
            if (err)
                return callback(err);
            
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
            
            async.parallel([
                db.editTags.bind(null, subscription, ctx.addTags, ctx.removeTags),
                feed.save.bind(feed)
            ], callback);
        });
    },

    unsubscribe: function(ctx, url, callback) {
        // Find a feed for this URL
        db.Feed.findOne({ feedURL: url }, function(err, feed) {
            if (err)
                return callback(err);
            
            var subscription = findSubscription(ctx.user.subscriptions, feed);
            if (!subscription)
                return callback();
        
            // Delete Subscription for this feed
            subscription.remove();
            feed.numSubscribers--;
        
            // If feed.numSubscribers is 0, delete feed
            if (feed.numSubscribers === 0)
                feed.remove(callback);
            else
                feed.save(callback);
        });
    },
    
    edit: function(ctx, url, callback) {
        // Find a feed for this URL
        db.Feed.findOne({ feedURL: url }, function(err, feed) {
            if (err)
                return callback(err);
            
            // Find Subscription for this URL
            var subscription = findSubscription(ctx.user.subscriptions, feed);
            if (!subscription)
                return callback();
            
            // Update subscription.title if needed
            if (ctx.title)
                subscription.title = ctx.title;
                
            // Add/remove tags from subscription
            db.editTags(subscription, ctx.addTags, ctx.removeTags, callback);
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
    var streams = utils.parseStreams(req.body.s);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    // bind the action function to the context
    var action = actions[req.body.ac].bind(null, ctx);
    
    // call the action function for each stream and then save the user
    async.series([
        async.each.bind(null, streams, action),
        ctx.user.save.bind(ctx.user)
    ], function(err) {
        if (err)
            return res.send(500, 'Error=Unknown');
        
        res.send('OK');
    });
});

app.post('/reader/api/0/subscription/quickadd', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    var streams = utils.parseStreams(req.body.quickadd);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    async.series([
        actions.subscribe.bind(null, req, streams[0]),
        req.user.save.bind(req.user)
    ], function(err) {
        if (err)
            return res.send(500, 'Error=Unknown');
        
        res.send('OK');
    });
});

// lists all of the feeds a user is subscribed to
app.get('/reader/api/0/subscription/list', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
        
    req.user.populate('subscriptions.feed subscriptions.tags', function(err, user) {
        if (err)
            return res.send(500, 'Error=Unknown');
        
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
    });
});

// checks to see if a user is subscribed to a particular feed
app.get('/reader/api/0/subscribed', function(req, res) {
    var streams = utils.parseStreams(req.query.s);
    if (!streams)
        return res.send(400, 'Error=InvalidStream');
        
    // Find a feed for the first stream
    db.Feed.findOne({ feedURL: streams[0] }, function(err, feed) {
        if (err)
            return res.send(500, 'Error=Unknown');
        
        // Find Subscription for this URL
        var subscription = findSubscription(req.user.subscriptions, feed);
        return res.send('' + !!subscription);
   
    });
});

app.get('/reader/api/0/subscription/export', function(req, res) {
    
});