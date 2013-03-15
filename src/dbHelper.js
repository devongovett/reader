var mongoose = require('mongoose')
var ref = function(type) {
    return {
        type: mongoose.Schema.Types.ObjectId,
        ref: type
    };
};

exports.ref = ref;