var mongoose = require('mongoose'),
    utils = require('../utils');

var Tag = mongoose.Schema({
    user: utils.ref('User'),
    type: String,       // state or label
    name: String,
    sortID: { type: String, default: utils.uid }
});

Tag.virtual('stringID').get(function() {
    var userID = this.user._id || this.user;
    return 'user/' + userID + '/' + this.type + '/' + this.name;
});

module.exports = mongoose.model('Tag', Tag);