// shared constants
var settings = require(__dirname + '/' + (process.argv[2] || 'googlereader.json'));
exports.server = settings.server;
exports.api = settings.api;
exports.username = settings.username;
exports.password = settings.password;

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