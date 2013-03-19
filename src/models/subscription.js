var mongoose = require('mongoose'),
    utils = require('../utils');

var Subscription = mongoose.Schema({
    title: String,      // the user is allowed to rename subscriptions
    feed: utils.ref('Feed'),
    tags: [utils.ref('Tag')],
    sortID: Number
});

module.exports = mongoose.model('Subscription', Subscription);