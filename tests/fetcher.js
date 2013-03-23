var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    nock = require('nock'),
    fetcher = require('../src/fetcher'),
    db = require('../src/db'),
    kue = require('kue');
    
// connect to a test database and create the redis job queue
db.connect('reader_test_fetcher');
var jobs = kue.createQueue();
    
QUnit.module('Fetcher');

var host = 'http://example.com',
    path = '/feed.xml',
    url = host + path,
    tests = __dirname + '/test_data',
    feedID = null;
    
// like deepEqual but ignores keys that aren't specified by the test
function check(object, keys) {
    for (var key in keys) {
        if (Array.isArray(keys[key])) {
            if (!Array.isArray(object[key]) || object[key].length !== keys[key].length) {
                assert.ok(false, 'Invalid');
            } else {
                object[key].forEach(function(val, i) {
                    check(val, keys[key][i])
                });
            }
        } else {
            assert.deepEqual(object[key], keys[key]);
        }
    }
}

function checkFeed(keys) {
    jobs.create('feed', { feedID: feedID })
        .save()
        .on('complete', function() {
            db.Feed
            .findById(feedID)
            .populate({ path: 'posts', options: { sort: { date: -1 }}})
            .exec(function(err, feed) {
                assert.ok(!err);
                assert.ok(feed.successfulCrawlTime instanceof Date);
                check(feed, keys);
                QUnit.start();
            });
        })
        .on('failed', function() {
            assert.ok(false, 'error thrown by fetcher');
            QUnit.start();
        });
}
    
QUnit.asyncTest('initial load', function() {
    nock(host)
        .get(path)
        .replyWithFile(200, tests + '/old.xml');

    db.Feed.create({ feedURL: url }, function(err, feed) {
        feedID = feed.id;
        
        checkFeed({
            feedURL: url,
            siteURL: 'http://example.com/',
            title: 'Test Blog',
            description: 'A test blog that is so awesome',
            posts: [{
                guid: 'http://example.com/blog/1',
                title: 'A Test Post 1',
                body: 'This is the main content of post 1. Isn\'t it great?',
                summary: null,
                url: 'http://example.com/blog/1',
                date: new Date('Thu, 07 Mar 2013 07:37:47 -0800'),
            }, {
                guid: 'http://example.com/blog/2',
                title: 'A Test Post 2',
                body: 'This is the main content of post 2. Isn\'t it great?',
                summary: null,
                url: 'http://example.com/blog/2',
                date: new Date('Wed, 06 Mar 2013 02:32:13 -0800')
            }, {
                guid: 'http://example.com/blog/3',
                title: 'A Test Post 3',
                body: 'This is the main content of post 3. Isn\'t it great?',
                summary: null,
                url: 'http://example.com/blog/3',
                date: new Date('Tue, 05 Mar 2013 01:03:24 -0800')
            }]
        });
    });
});

QUnit.asyncTest('no update', function() {
    nock(host)
        .get(path)
        .replyWithFile(200, tests + '/old.xml');
        
    checkFeed({
        feedURL: url,
        siteURL: 'http://example.com/',
        title: 'Test Blog',
        description: 'A test blog that is so awesome',
        posts: [{
            guid: 'http://example.com/blog/1',
            title: 'A Test Post 1',
            body: 'This is the main content of post 1. Isn\'t it great?',
            summary: null,
            url: 'http://example.com/blog/1',
            date: new Date('Thu, 07 Mar 2013 07:37:47 -0800'),
        }, {
            guid: 'http://example.com/blog/2',
            title: 'A Test Post 2',
            body: 'This is the main content of post 2. Isn\'t it great?',
            summary: null,
            url: 'http://example.com/blog/2',
            date: new Date('Wed, 06 Mar 2013 02:32:13 -0800')
        }, {
            guid: 'http://example.com/blog/3',
            title: 'A Test Post 3',
            body: 'This is the main content of post 3. Isn\'t it great?',
            summary: null,
            url: 'http://example.com/blog/3',
            date: new Date('Tue, 05 Mar 2013 01:03:24 -0800')
        }]
    });
});

QUnit.asyncTest('add posts', function() {
    nock(host)
        .get(path)
        .replyWithFile(200, tests + '/add_post.xml');
        
    checkFeed({
        feedURL: url,
        siteURL: 'http://example.com/',
        title: 'Test Blog',
        description: 'A test blog that is so awesome',
        posts: [{
            guid: 'http://example.com/blog/5',
            title: 'A New Post 1',
            body: "This is the main content of new post 1. Isn't it great?",
            url: 'http://example.com/blog/5',
            date: new Date('Fri, 08 Mar 2013 13:37:27 -0800')
        }, {
            guid: 'http://example.com/blog/4',
            title: 'A New Post 2',
            body: "This is the main content of new post 2. Isn't it great?",
            url: 'http://example.com/blog/4',
            date: new Date('Fri, 08 Mar 2013 12:16:33 -0800')
        }, {
            guid: 'http://example.com/blog/1',
            title: 'A Test Post 1',
            body: 'This is the main content of post 1. Isn\'t it great?',
            url: 'http://example.com/blog/1',
            date: new Date('Thu, 07 Mar 2013 07:37:47 -0800'),
        }, {
            guid: 'http://example.com/blog/2',
            title: 'A Test Post 2',
            body: 'This is the main content of post 2. Isn\'t it great?',
            url: 'http://example.com/blog/2',
            date: new Date('Wed, 06 Mar 2013 02:32:13 -0800')
        }, {
            guid: 'http://example.com/blog/3',
            title: 'A Test Post 3',
            body: 'This is the main content of post 3. Isn\'t it great?',
            url: 'http://example.com/blog/3',
            date: new Date('Tue, 05 Mar 2013 01:03:24 -0800')
        }]
    });
});

// TODO: update posts

QUnit.asyncTest('meta changed', function() {
    nock(host)
        .get(path)
        .replyWithFile(200, tests + '/update_meta.xml');
        
    checkFeed({
        feedURL: url,
        siteURL: 'http://example.com/',
        title: 'Example Blog',
        description: 'This is the new description'
    });
});

// reset everything when we're done
QUnit.done(function() {
    jobs.client.flushdb();
    db.dropDatabase(process.exit);
});