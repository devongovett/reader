var mongoose = require('mongoose'),
    async = require('async'),
    utils = require('../utils');

// A Feed containing posts, shared across all users
var Feed = mongoose.Schema({
    title: String,
    description: String,
    author: String,
    language: String,
    copyright: String,
    categories: [String],
    feedURL: { type: String, index: { unique: true }},
    siteURL: String,
    posts: [utils.ref('Post')],
    numSubscribers: { type: Number, default: 0 },
    successfulCrawlTime: Date,
    failedCrawlTime: Date,
    lastFailureWasParseFailure: Boolean,
    lastModified: Date,
    etag: String
});

Feed.pre('remove', function(callback) {
    var Post = mongoose.model('Post');
    async.each(this.posts, function(post, next) {
        Post.remove(post, next);
    }, callback);
});

module.exports = mongoose.model('Feed', Feed);