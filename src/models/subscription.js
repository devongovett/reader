var mongoose = require('mongoose');

var Subscription = mongoose.Schema({
    title: String,      // the user is allowed to rename subscriptions
    feed: mongoose.ref('Feed'),
    tags: [mongoose.ref('Tag')],
    sortID: Number
});

module.exports = mongoose.model('Subscription', Subscription);