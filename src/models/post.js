var mongoose = require('mongoose'),
    utils = require('../utils');
    
// A Post in a Feed, shared across all users
// User specific tags stored here to avoid having separate 
// post records for each user
var Post = mongoose.Schema({
    feed: utils.ref('Feed'),
    guid: String,
    title: String,
    body: String,
    summary: String,
    url: String,
    date: Date,
    author: String,
    commentsURL: String,
    categories: [String],
    tags: [utils.ref('Tag')]
});

Post.virtual('shortID').get(function() {
    return utils.shortItemId(this.id);
});

Post.virtual('longID').get(function() {
    return 'tag:google.com,2005:reader/item/' + this.id;
});

module.exports = mongoose.model('Post', Post);