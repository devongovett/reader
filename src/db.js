var mongoose = require('mongoose'),
    rsvp = require('rsvp'),
    Promise = rsvp.Promise;

require('./mongoose-promise');

// export the modules
exports.Feed = require('./models/feed');
exports.Post = require('./models/post');
exports.User = require('./models/user');
exports.Tag = require('./models/tag');
exports.Preference = require('./models/preference');

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
    return model.findOneAndUpdate(item, {}, { upsert: true });
};

exports.updateOrCreate = function(model, item, update) {
    return model.findOneAndUpdate(item, update, { upsert: true });
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

function getTags(tags) {
    if (tags && tags.length)
        return exports.Tag.find({ $or: tags });
    
    var promise = new rsvp.Promise();
    promise.resolve([]);
    return promise;
}

// Returns a list of posts for a list of streams (feeds and tags) as parsed
// by utils.parseStreams.
//
// Options:
//   excludeTags - items containing these tags will be excluded from the results
//   minTime - the date of the oldest item to include
//   maxTime - the date of the newest item to include
//   limit - the maximum number of items to return
//   sort - the field to sort (see mongoose docs)
exports.postsForStreams = function(streams, options) {
    if (!options)
        options = {};
    
    // separate streams by type
    var feeds = [], tags = [];
    streams.forEach(function(stream) {
        if (stream.type === 'feed')
            feeds.push(stream.value);
        else
            tags.push(stream.value);
    });
        
    // load the tags to include and exclude
    var includeTags, excludeTags;
    return rsvp.all([
        getTags(tags),
        getTags(options.excludeTags)
    ]).then(function(results) {
        includeTags = results[0];
        excludeTags = results[1];
        
        // find feeds given directly and by tag
        return exports.Feed.find({
            $or: [
                { feedURL: { $in: feeds }},
                { tags: { $in: includeTags, $nin: excludeTags }}
            ]
        });
    }).then(function(feeds) {
        // find posts by feed and tags, and filter by date
        var query = exports.Post.find({
            $or: [
                { feed: { $in: feeds }},
                { tags: { $in: includeTags }}
            ],
            tags: { $nin: excludeTags },
            published: {
                $gte: new Date((1000 * options.minTime) || 0),
                $lte: new Date((1000 * options.maxTime) || Date.now())
            }
        });
        
        if (options.limit)
            query.limit(options.limit);
            
        if (options.sort)
            query.sort(options.sort);
            
        if (options.count)
            query.count();
            
        if (options.populate)
            query.populate(options.populate);
            
        return query;
    });
};