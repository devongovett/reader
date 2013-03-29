var mongoose = require('mongoose'),
    async = require('async');

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

exports.findOrCreate = function(model, item, callback) {
    model.findOne(item, function(err, record) {
        if (err) 
            return callback(err);
            
        if (!record) {
            model.create(item, function(err, record) {
                callback(err, record);
            });
        } else {
            callback(null, record);
        }
    });
};

// Adds and removes tags from a subscription or post
exports.editTags = function(record, addTags, removeTags, callback) {
    async.parallel([
        async.each.bind(null, addTags || [], function(tag, next) {
            exports.findOrCreate(exports.Tag, tag, function(err, tag) {
                record.tags.addToSet(tag);
                next(err);
            });
        }),
        
        async.each.bind(null, removeTags || [], function(tag, next) {
            exports.Tag.findOne(tag, function(err, tag) {
                record.tags.remove(tag);
                next(err);
            });
        })
    ], callback);
};

// gets the Posts for a stream descriptor as parsed by utils.parseStreams
exports.postsForStream = function(stream, callback) {
    switch (stream.type) {
        case 'feed':
            exports.Feed.findOne({ feedURL: stream.value })
              .populate('posts')
              .exec(function(err, feed) {
                  callback(null, feed.posts);
              });
              
            break;
            
        case 'tag':
            exports.Tag.findOne(stream.value, function(err, tag) {
                if (err)
                    return callback(err);
                    
                // TODO: get posts in subscriptions with this tag too
                exports.Post.find({ tags: tag }, callback);
            });
            
            break;
        
        default:
            callback('InvalidStream');
    }
};