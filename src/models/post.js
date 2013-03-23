var mongoose = require('mongoose'),
    utils = require('../utils');
    
// A Post in a Feed, shared across all users
// User specific tags stored here to avoid having separate 
// post records for each user
var Post = mongoose.Schema({
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

module.exports = mongoose.model('Post', Post);