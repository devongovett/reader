var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    nock = require('nock'),
    feeder = require('./feeder');
    
QUnit.module('feeder');

var host = 'http://example.com',
    path = '/feed.xml',
    url = host + path,
    tests = __dirname + '/test_data';
    
var postCount = 0,
    updateCount = 0,
    metaCount = 0;
    
var feed = new feeder.Feeder(url)
    .on('meta', function(meta) {
        metaCount++;
    })
    .on('post', function(post) {
        postCount++;
    })
    .on('update', function(post) {
        updateCount++;
    })
    .on('error', function() {
        assert.ok(false, 'An error was thrown');
    });
    
QUnit.asyncTest('initial load', function() {
    nock(host)
        .get(path)
        .replyWithFile(200, tests + '/old.xml');
        
    feed.once('meta', function(meta) {
        assert.equal(meta.title, 'Test Blog');
        assert.equal(meta.description, 'A test blog that is so awesome');
        assert.equal(meta.link, 'http://example.com/');
        assert.deepEqual(meta.cloud, {});
    });
        
    feed.once('loadEnd', function() {
        assert.equal(postCount, 3);
        assert.equal(updateCount, 0);
        assert.equal(metaCount, 1);
        QUnit.start();
    });
        
    postCount = updateCount = metaCount = 0;
    feed.start();
});

QUnit.asyncTest('no update', function() {
    nock(host)
        .get(path)
        .replyWithFile(200, tests + '/old.xml');
        
    feed.once('loadEnd', function() {
        assert.equal(postCount, 0);
        assert.equal(updateCount, 0);
        assert.equal(metaCount, 0);
        QUnit.start();
    });
        
    postCount = updateCount = metaCount = 0;
    feed.reload();
});

QUnit.asyncTest('add posts', function() {
    nock(host)
        .get(path)
        .replyWithFile(200, tests + '/add_post.xml');
        
    feed.once('loadEnd', function() {
        assert.equal(postCount, 2);
        assert.equal(updateCount, 0);
        assert.equal(metaCount, 0);
        QUnit.start();
    });
        
    postCount = updateCount = metaCount = 0;
    feed.reload();
});

QUnit.asyncTest('update post', function() {
    nock(host)
        .get(path)
        .replyWithFile(200, tests + '/update_post.xml');
        
    feed.once('loadEnd', function() {
        assert.equal(postCount, 0);
        assert.equal(updateCount, 1);
        assert.equal(metaCount, 0);
        QUnit.start();
    });
        
    postCount = updateCount = metaCount = 0;
    feed.reload();
});

QUnit.asyncTest('meta changed', function() {
    nock(host)
        .get(path)
        .replyWithFile(200, tests + '/update_meta.xml');
        
    feed.once('loadEnd', function() {
        assert.equal(postCount, 0);
        assert.equal(updateCount, 0);
        assert.equal(metaCount, 1);
        QUnit.start();
    });
        
    postCount = updateCount = metaCount = 0;
    feed.reload();
});

QUnit.done(function() {
    feed.stop();
});