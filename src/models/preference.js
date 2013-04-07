var mongoose = require('mongoose'),
    utils = require('../utils');

var Preference = mongoose.Schema({
    user: utils.ref('User'),
    stream: String,
    key: String,
    value: String
});

module.exports = mongoose.model('Preference', Preference);