var mongoose = require('mongoose'),
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
    numSubscribers: Number,
    successfulCrawlTime: Date,
    failedCrawlTime: Date,
    lastFailureWasParseFailure: Boolean,
    lastModified: Date,
    etag: String
});

module.exports = mongoose.model('Feed', Feed);