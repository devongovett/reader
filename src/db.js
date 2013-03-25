var mongoose = require('mongoose'),
    async = require('async');

// export the modules
exports.Feed = require('./models/feed');
exports.Post = require('./models/post');
exports.User = require('./models/user');
exports.Tag = require('./models/tag');
exports.Subscription = require('./models/subscription');

// connect to the database
exports.connect = function(database) {
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