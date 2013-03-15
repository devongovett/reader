var mongoose = require('mongoose');

exports.ref = function(type) {
    return {
        type: mongoose.Schema.Types.ObjectId,
        ref: type
    };
};