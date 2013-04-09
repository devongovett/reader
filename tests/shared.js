// shared constants
exports.server = 'http://localhost:3456';
exports.api = exports.server + '/reader/api/0';

// stored by the user tests for later
exports.userID = null;
exports.token = null;

// we use this version of request so we can wrap it 
// to do authentication by default later on
var request = require('request');
exports.setAuth = function(auth) {
    request = require('request').defaults({
        headers: { Authorization: 'GoogleLogin auth=' + auth }
    });
};

exports.request = function() {
    return request.apply(this, arguments);
};

exports.request.post = function() {
    return request.post.apply(this, arguments);
};