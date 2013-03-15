var mongoose = require('mongoose'),
    utils = require('../utils');

var Tag = mongoose.Schema({
    user: utils.ref('User'),
    type: String,       // state or label
    name: String,
    sortID: Number
});

module.exports = mongoose.model('Tag', Tag);