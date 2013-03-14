var mongoose = require('mongoose');

// A Post in a Feed, shared across all users
// User specific tags stored here to avoid having separate 
// post records for each user
var Post = mongoose.Schema({
    title: String,
    description: String,
    url: String,
    date: Date,
    author: String,
    body: String,
    tags: [mongoose.ref('Tag')]
});

module.exports = mongoose.model('Post', Post);