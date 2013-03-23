var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    Subscription = require('./subscription');
    
var SALT_WORK_FACTOR = 10;

var User = mongoose.Schema({
    username: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true },
    signupTime: { type: Date, default: Date.now },
    subscriptions: [Subscription.schema]
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

module.exports = mongoose.model('User', User);