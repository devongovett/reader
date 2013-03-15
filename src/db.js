var mongoose = require('mongoose');

// export the modules
exports.Feed = require('./models/feed');
exports.Post = require('./models/post');
exports.User = require('./models/user');
exports.Tag = require('./models/tag');
exports.Subscription = require('./models/subscription');

// connect to the database
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