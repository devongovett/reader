var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    utils = require('../utils');
    
var SALT_WORK_FACTOR = 10;

var User = mongoose.Schema({
    username: { type: String, required: true, index: { unique: true }, validate: utils.isEmail },
    password: { type: String, required: true },
    signupTime: { type: Date, default: Date.now }
});

// hash passwords using bcrypt when they are changed
User.pre('save', function(next) {
    var user = this;
    
    if (!user.isModified('password'))
        return next();
        
    bcrypt.hash(user.password, SALT_WORK_FACTOR, function(err, hash) {
        if (err) return next(err);
        
        user.password = hash;
        next();
    });
});

// convenience function to check if the password is correct
User.methods.checkPassword = function(password, callback) {
    bcrypt.compare(password, this.password, callback);
};

// A getter that returns a promise for all of the feeds a user is subscribed to
User.virtual('feeds').get(function() {
    var Feed = mongoose.model('Feed'),
        Tag = mongoose.model('Tag');
        
    var tag = utils.parseTags('user/-/state/com.google/reading-list', this)[0];
    return Tag.findOne(tag).then(function(tag) {
        if (!tag) 
            return [];
            
        return Feed.find({ tags: tag }).populate('tags');
    });
});

module.exports = mongoose.model('User', User);