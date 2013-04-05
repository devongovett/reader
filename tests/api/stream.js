var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    request = require('request'),
    utils = require('../../src/utils'),
    shared = require('../shared');
    
QUnit.module('Stream');

QUnit.asyncTest('details', function() {
    request(shared.api + '/stream/details?s=feed/http://example.com/feed.xml', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.subscribers, '1');
        assert.equal(body.velocity, '0.0');
        assert.equal(typeof body.successfulCrawlTimeUsec, 'number');
        assert.equal(typeof body.failedCrawlTimeUsec, 'number');
        assert.equal(body.lastFailureWasParseFailure, false);
        assert.deepEqual(body.trendsCharts, {});
        assert.equal(body.feedUrl, 'http://example.com/feed.xml');
        
        QUnit.start();
    });
});

QUnit.asyncTest('details invalid feed', function() {
    request(shared.api + '/stream/details?s=feed/foobar', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    });
});

QUnit.asyncTest('details unknown feed', function() {
    request(shared.api + '/stream/details?s=feed/http://unknown.com/rss', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.subscribers, '-1');
        assert.equal(body.velocity, '0.0');
        assert.equal(body.successfulCrawlTimeUsec, -1);
        assert.equal(body.failedCrawlTimeUsec, -1);
        assert.equal(body.lastFailureWasParseFailure, false);
        assert.deepEqual(body.trendsCharts, {});
        assert.equal(body.feedUrl, 'http://unknown.com/rss');
        
        QUnit.start();
    });
});

QUnit.asyncTest('item ids invalid stream', function() {
    request(shared.api + '/stream/items/ids?s=feed/unknown', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    });
});

QUnit.asyncTest('item ids invalid streams', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml&s=feed/unknown', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    });
});

QUnit.asyncTest('item ids invalid count', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidCount');
        QUnit.start();
    });
});

QUnit.asyncTest('item ids invalid count bad number', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml&n=dfih', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidCount');
        QUnit.start();
    });
});

QUnit.asyncTest('item ids invalid old time', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml&n=20&ot=dof', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidTime');
        QUnit.start();
    });
});

QUnit.asyncTest('item ids invalid new time', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml&n=20&ot=123&nt=dff', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidTime');
        QUnit.start();
    });
});

QUnit.asyncTest('item ids invalid rank', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml&n=20&ot=123&nt=234&r=c', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidRank');
        QUnit.start();
    });
});

QUnit.asyncTest('item ids invalid tag', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml&n=20&ot=123&nt=234&r=n&xt=user/unknown', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidTag');
        QUnit.start();
    });
});

QUnit.asyncTest('item ids', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml&n=20', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(typeof body.continuation, 'string');
        assert.ok(Array.isArray(body.itemRefs));
        assert.equal(body.itemRefs.length, 5);
        
        var lastTimestamp = Infinity;
        body.itemRefs.forEach(function(post) {
            assert.equal(typeof post.id, 'string');
            assert.ok(/^-?[0-9]+$/.test(post.id));
            assert.deepEqual(post.directStreamIds, []);
            assert.ok(typeof post.timestampUsec, 'number');
            assert.ok(post.timestampUsec < lastTimestamp);
            lastTimestamp = post.timestampUsec;
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item ids count', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml&n=3', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(typeof body.continuation, 'string');
        assert.ok(Array.isArray(body.itemRefs));
        assert.equal(body.itemRefs.length, 3);
        
        var lastTimestamp = Infinity;
        body.itemRefs.forEach(function(post) {
            assert.equal(typeof post.id, 'string');
            assert.ok(/^-?[0-9]+$/.test(post.id));
            assert.deepEqual(post.directStreamIds, []);
            assert.ok(typeof post.timestampUsec, 'number');
            assert.ok(post.timestampUsec < lastTimestamp);
            lastTimestamp = post.timestampUsec;
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item ids date range', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml&n=20&ot=1362474204&nt=1362773793', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(typeof body.continuation, 'string');
        assert.ok(Array.isArray(body.itemRefs));
        assert.equal(body.itemRefs.length, 4);
        
        var lastTimestamp = Infinity;
        body.itemRefs.forEach(function(post) {
            assert.equal(typeof post.id, 'string');
            assert.ok(/^-?[0-9]+$/.test(post.id));
            assert.deepEqual(post.directStreamIds, []);
            assert.ok(typeof post.timestampUsec, 'number');
            assert.ok(post.timestampUsec < lastTimestamp);
            lastTimestamp = post.timestampUsec;
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item ids ranking', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed1.xml&n=20&r=o', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(typeof body.continuation, 'string');
        assert.ok(Array.isArray(body.itemRefs));
        assert.equal(body.itemRefs.length, 5);
        
        var lastTimestamp = 0;
        body.itemRefs.forEach(function(post) {
            assert.equal(typeof post.id, 'string');
            assert.ok(/^-?[0-9]+$/.test(post.id));
            assert.deepEqual(post.directStreamIds, []);
            assert.ok(typeof post.timestampUsec, 'number');
            assert.ok(post.timestampUsec > lastTimestamp);
            lastTimestamp = post.timestampUsec;
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item ids tag', function() {
    request(shared.api + '/stream/items/ids?s=user/-/state/com.google/reading-list&n=20', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(typeof body.continuation, 'string');
        assert.ok(Array.isArray(body.itemRefs));
        assert.equal(body.itemRefs.length, 16);
        
        var lastTimestamp =Infinity;
        body.itemRefs.forEach(function(post) {
            assert.equal(typeof post.id, 'string');
            assert.ok(/^-?[0-9]+$/.test(post.id));
            assert.deepEqual(post.directStreamIds, []);
            assert.ok(typeof post.timestampUsec, 'number');
            assert.ok(post.timestampUsec <= lastTimestamp);
            lastTimestamp = post.timestampUsec;
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item ids feed exclude', function() {
    request(shared.api + '/stream/items/ids?s=feed/http://example.com/feed.xml&n=20&xt=user/-/label/folder1', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(typeof body.continuation, 'string');
        assert.ok(Array.isArray(body.itemRefs));
        assert.equal(body.itemRefs.length, 2);
        
        var lastTimestamp = Infinity;
        body.itemRefs.forEach(function(post) {
            assert.equal(typeof post.id, 'string');
            assert.ok(/^-?[0-9]+$/.test(post.id));
            assert.deepEqual(post.directStreamIds, []);
            assert.ok(typeof post.timestampUsec, 'number');
            assert.ok(post.timestampUsec <= lastTimestamp);
            lastTimestamp = post.timestampUsec;
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item ids tag exclude item tag', function() {
    request(shared.api + '/stream/items/ids?s=user/-/state/com.google/reading-list&n=20&xt=user/-/state/com.google/read', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(typeof body.continuation, 'string');
        assert.ok(Array.isArray(body.itemRefs));
        assert.equal(body.itemRefs.length, 10);
        
        var lastTimestamp = Infinity;
        body.itemRefs.forEach(function(post) {
            assert.equal(typeof post.id, 'string');
            assert.ok(/^-?[0-9]+$/.test(post.id));
            assert.deepEqual(post.directStreamIds, []);
            assert.ok(typeof post.timestampUsec, 'number');
            assert.ok(post.timestampUsec <= lastTimestamp);
            lastTimestamp = post.timestampUsec;
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item ids tag exclude feed tag', function() {
    request(shared.api + '/stream/items/ids?s=user/-/state/com.google/reading-list&n=20&xt=user/-/label/bar', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(typeof body.continuation, 'string');
        assert.ok(Array.isArray(body.itemRefs));
        assert.equal(body.itemRefs.length, 6);
        
        var lastTimestamp = Infinity;
        body.itemRefs.forEach(function(post) {
            assert.equal(typeof post.id, 'string');
            assert.ok(/^-?[0-9]+$/.test(post.id));
            assert.deepEqual(post.directStreamIds, []);
            assert.ok(typeof post.timestampUsec, 'number');
            assert.ok(post.timestampUsec <= lastTimestamp);
            lastTimestamp = post.timestampUsec;
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item count invalid stream', function() {
    request(shared.api + '/stream/items/count?s=feed/dumb', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    });
});

QUnit.asyncTest('item count feed', function() {
    request(shared.api + '/stream/items/count?s=feed/http://example.com/feed1.xml', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, '5');
        QUnit.start();
    });
});

QUnit.asyncTest('item count tag', function() {
    request(shared.api + '/stream/items/count?s=user/-/state/com.google/reading-list', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, '16');
        QUnit.start();
    });
});