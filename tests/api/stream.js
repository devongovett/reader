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