var mongoose = require('mongoose');
var dbHelper = require('../dbHelper')
var Subscription = mongoose.Schema({
    title: String,      // the user is allowed to rename subscriptions
    feed: dbHelper.ref('Feed'),
    tags: [dbHelper.ref('Tag')],
    sortID: Number
});

module.exports = mongoose.model('Subscription', Subscription);