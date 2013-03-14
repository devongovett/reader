var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

function Ref(type) {
    return { type: ObjectId, ref: type };
}

// shared models for all users
var Post = mongoose.Schema({
    title: String,
    description: String,
    url: String,
    date: Date,
    author: String,
    body: String
});

var Feed = mongoose.Schema({
    title: String,
    feedURL: { type: String, unique: true },
    siteURL: String,
    posts: [Ref('Post')],
    subscribers: Number,
    successfulCrawlTime: Date,
    failedCrawlTime: Date,
    lastFailureWasParseFailure: Boolean
});

// user specific models
var Tag = mongoose.Schema({
    name: String,
    sortID: Number
});

var Item = mongoose.Schema({
    post: Ref('Post'),
    tags: [Ref('Tag')]
});

var Subscription = mongoose.Schema({
    feed: Ref('Feed'),
    tags: [Ref('Tag')]
});

var User = mongoose.Schema({
    username: String,
    password: String,
    subscriptions: [Subscription],
    tags: [Tag]
});

exports.Feed = mongoose.model('Feed', Feed);
exports.Post = mongoose.model('Post', Post);
exports.Tag = mongoose.model('Tag', Tag);
exports.Item = mongoose.model('Item', Item);
exports.Subscription = mongoose.model('Subscription', Subscription);
exports.User = mongoose.model('User', User);

mongoose.connect('mongodb://localhost/reader');
var db = mongoose.connection;

db.on('error', function(err) {
    console.error(err);
});

db.once('open', function() {
    console.log('Connected to Mongo!');
    
    // test
    exports.User.find(function(err, users) {
        console.log(users);
    });
});