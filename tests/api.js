// start server
process.env.NODE_ENV = 'testing';
var app = require('../src/api'),
    QUnit = require('qunit-cli'),
    db = require('../src/db'),
    kue = require('kue'),
    jobs = kue.createQueue();
    
// start fetcher
require('../src/fetcher');

// run tests
require('./api/user');
require('./api/subscription');
require('./api/tag');
require('./api/stream');

// destroy the testing database when we're done
QUnit.done(function() {
    jobs.client.flushdb();
    db.dropDatabase(process.exit);
});