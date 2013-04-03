var mongoose = require('mongoose'),
    rsvp = require('rsvp'),
    Promise = rsvp.Promise,
    async = require('async');

require('./mongoose-promise');

// export the modules
exports.Feed = require('./models/feed');
exports.Post = require('./models/post');
exports.User = require('./models/user');
exports.Tag = require('./models/tag');
exports.Subscription = require('./models/subscription');

// connect to the database
var connected = false;
exports.connect = function(database) {
    if (mongoose.connection.db)
        return;
    
    mongoose.connect('mongodb://localhost/' + (database || 'reader'));
    var db = mongoose.connection;

    db.on('error', function(err) {
        console.error(err);
    });

    db.once('open', function() {
        console.log('Connected to Mongo!');
    });
    
    return db;
};

// used by the tests
exports.dropDatabase = function(callback) {
    if (!mongoose.connection) 
        return callback(new Error('Not connected'));
        
    mongoose.connection.db.dropDatabase(callback);
};

exports.findOrCreate = function(model, item) {
    return model.findOne(item).then(function(record) {
        if (!record)
            return model.create(item);
            
        return record;
    });
};

// Adds and removes tags from a subscription or post
exports.editTags = function(record, addTags, removeTags) {
    addTags || (addTags = []);
    removeTags || (removeTags = []);
    
    var add = addTags.map(function(tag) {
        return exports.findOrCreate(exports.Tag, tag).then(function(tag) {
            record.tags.addToSet(tag);
        });
    });
    
    var remove = removeTags.map(function(tag) {
        return exports.Tag.findOne(tag).then(function(tag) {
            record.tags.remove(tag);
        });
    });
    
    return rsvp.all(add.concat(remove));
};

// Gets the Posts for a stream descriptor as parsed by utils.parseStreams
exports.postsForStream = function(stream) {
    switch (stream.type) {
        case 'feed':
            return exports.Feed.findOne({ feedURL: stream.value })
              .populate('posts')
              .then(function(feed) {
                  return feed.posts;
              });
            
        case 'tag':            
            return exports.Tag.findOne(stream.value).then(function(tag) {
                // TODO: get posts in subscriptions with this tag too
                return exports.Post.find({ tags: tag });
            });
        
        default:
            return rsvp.defer().reject('Unknown stream type');
    }
};