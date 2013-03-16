// start server
process.env.NODE_ENV = 'testing';
var app = require('../src/api'),
    QUnit = require('qunit-cli'),
    db = require('../src/db');

// run tests
require('./api/user');

// destroy the testing database when we're done
QUnit.done(function() {
    db.dropDatabase(process.exit);
});