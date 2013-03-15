var mongoose = require('mongoose');
var dbHelper = require('../dbHelper')
var Tag = mongoose.Schema({
    user: dbHelper.ref('User'),
    type: String,       // state or label
    name: String,
    sortID: Number
});

module.exports = mongoose.model('Tag', Tag);