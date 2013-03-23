var express = require('express'),
    Validator = require('validator').Validator,
    db = require('../db'),
    utils = require('../utils'),
    kue = require('kue'),
    jobs = kue.createQueue();
    
var app = module.exports = express();

// prevent validator from throwing errors, and instead return false on error
// FIXME: there has to be a better way to do this
var validator = new Validator;
validator.error = function() { return false; }

// Helper function to find a subscription in an array based on a feed
function findSubscription(subscriptions, feed) {
    for (var i = 0; i < subscriptions.length; i++) {
        if (String(subscriptions[i].feed) === feed.id)
            return subscriptions[i];
    }
    
    return null;
}

app.post('/reader/api/0/subscription/edit', function(req, res) {
    if (!utils.checkAuth(req, res, true))
        return;
        
    var url = /^feed\//.test(req.body.s) && req.body.s.slice(5);
    if (!validator.check(url).isUrl())
        return res.send(400, 'Error=InvalidStream');
        
    var addTags = utils.parseTags(req.body.a, req.user.id);
    if (req.body.a && !addTags)
        return res.send(400, 'Error=InvalidTag');
        
    var removeTags = utils.parseTags(req.body.r, req.user.id);
    if (req.body.r && !removeTags)
        return res.send(400, 'Error=InvalidTag');
        
    var user = req.user;
    switch (req.body.ac) {
        case 'subscribe':
            // 1. Find or add a Feed for this URL
            utils.findOrCreate(db.Feed, { feedURL: url }, function(err, feed) {
                if (err)
                    return res.send(500, 'Error=Unknown');
                    
                // If this feed was just added, start a high priority job to fetch it
                if (feed.numSubscribers === 0) {
                    jobs.create('feed', { feedID: feed.id })
                        .priority('high')
                        .save()
                }
                    
                // 2. Find or add a Subscription for the feed
                var subscription = findSubscription(user.subscriptions, feed);
                
                if (!subscription) {
                    subscription = new db.Subscription({ feed: feed });
                    user.subscriptions.push(subscription);
                    
                    // 3. Increment feed.numSubscribers if a subscription is added
                    feed.numSubscribers++;
                    feed.save();
                }
                
                // 4. Add/remove tags and update title (see edit action)
                if (req.body.t)
                    subscription.title = req.body.t;
                    
                // TODO: tags
                    
                req.user.save(function(err) {
                    if (err)
                        return res.send(500, 'Error=Unknown');
                    
                    res.send('OK');
                });
            });
            
            break;
        
        case 'unsubscribe':
            // 1. Find a Feed for this URL
            // 2. Delete Subscription for this feed
            // 3. Decrement feed.numSubscribers
            // 4. If feed.numSubscribers is 0, delete feed
        
        case 'edit':
            // 1. Find a Feed for this URL
            // 2. Find Subscription for this URL
            // 3. Update subscription.title if needed
            // 4. Add/remove tags and add them to subscription
        
        default:
            return res.send(400, 'Error=UnknownAction');
    }
});

app.get('/reader/api/0/subscription/list', function(req, res) {
    if (!utils.checkAuth(req, res))
        return;
        
    req.user.populate('subscriptions.feed subscriptions.tags', function(err, user) {
        var subscriptions = user.subscriptions.map(function(subscription) {
            var categories = subscription.tags.map(function(tag) {
                // TODO: check whether this only includes tags of type 'label'
                return {
                    id: 'user/' + user.id + '/' + tag.type + '/' + tag.name,
                    label: tag.name
                };
            });
            
            return {
                id: 'feed/' + subscription.feed.feedURL,
                title: subscription.title || subscription.feed.title || '(title unknown)',
                firstitemmsec: 0, // TODO
                sortid: 0,
                categories: categories
            };
        });
        
        utils.respond(res, {
            subscriptions: subscriptions
        });
    });
});

app.get('/reader/api/0/subscription/export', function(req, res) {
    
});

app.get('/reader/api/0/subscribed', function(req, res) {
    
});