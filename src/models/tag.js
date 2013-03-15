var mongoose = require('mongoose');

var Tag = mongoose.Schema({
    user: mongoose.ref('User'),
    type: String,       // state or label
    name: String,
    sortID: Number
});

module.exports = mongoose.model('Tag', Tag);