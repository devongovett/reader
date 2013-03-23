var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    request = require('request'),
    nock = require('nock'),
    utils = require('../../src/utils');
    
var API = 'http://localhost:3456/reader/api/0';
var token, userId;

QUnit.module('Subscription');

QUnit.asyncTest('subscribe unauthenticated', function() {
    request.post(API + '/subscription/edit', { jar: false }, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        assert.equal(body, 'Error=AuthRequired');
        QUnit.start();
    }).form({ s: 'feed/http://feeds.feedburner.com/WSwI', ac: 'subscribe' });
});

QUnit.asyncTest('subscribe missing token', function() {
    request.post(API + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidToken');
        QUnit.start();
    }).form({ s: 'feed/http://feeds.feedburner.com/WSwI', ac: 'subscribe' });
});

QUnit.asyncTest('subscribe invalid token', function() {
    request.post(API + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidToken');
        QUnit.start();
    }).form({ s: 'feed/http://feeds.feedburner.com/WSwI', ac: 'subscribe', T: 'invalid' });
});

QUnit.asyncTest('subscribe missing stream', function() {
    request(API + '/token', function(err, res, body) {
        token = body;
        request.post(API + '/subscription/edit', function(err, res, body) {
            assert.equal(res.statusCode, 400);
            assert.equal(body, 'Error=InvalidStream');
            QUnit.start();
        }).form({ ac: 'subscribe', T: token });
    });
});

QUnit.asyncTest('subscribe invalid stream', function() {
    request.post(API + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    }).form({ s: 'http://feeds.feedburner.com/WSwI', ac: 'subscribe', T: token });
});

QUnit.asyncTest('subscribe invalid url', function() {
    request.post(API + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    }).form({ s: 'feed/invalid', ac: 'subscribe', T: token });
});

QUnit.asyncTest('subscribe invalid tag', function() {
    request.post(API + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidTag');
        QUnit.start();
    }).form({ 
        s: 'feed/http://feeds.feedburner.com/WSwI',
        ac: 'subscribe',
        T: token,
        a: 'invalid'
    });
});

QUnit.asyncTest('subscribe invalid tags', function() {
    request(API + '/user-info', function(err, res, body) {
        userId = JSON.parse(body).userId;
        
        request.post(API + '/subscription/edit', function(err, res, body) {
            assert.equal(res.statusCode, 400);
            assert.equal(body, 'Error=InvalidTag');
            QUnit.start();
        }).form({ 
            s: 'feed/http://feeds.feedburner.com/WSwI',
            ac: 'subscribe',
            T: token,
            a: ['user/' + userId +  '/label/test', 'invalid'] // a valid one, and an invalid one
        });
    });
});

// probably should be in a separate test module
QUnit.test('parseTags', function() {
    assert.equal(utils.parseTags(null, 'id'), null);
    assert.equal(utils.parseTags('invalid', 'id'), null);
    assert.deepEqual(utils.parseTags('user/id/label/test', 'id'), [
        { type: 'label', name: 'test' }
    ]);
    
    // google reader also allows the userId to be replaced with a -
    assert.deepEqual(utils.parseTags('user/-/label/test', 'id'), [
        { type: 'label', name: 'test' }
    ]);
    
    assert.deepEqual(utils.parseTags(['user/id/label/test', 'user/id/state/com.google/read'], 'id'), [
        { type: 'label', name: 'test' },
        { type: 'state', name: 'com.google/read' }
    ]);
    
    assert.equal(utils.parseTags(['user/id/label/test', null], 'id'), null);
    assert.equal(utils.parseTags(['user/id/label/test', 1], 'id'), null);
    assert.equal(utils.parseTags(['user/id/label/test', 'invalid'], 'id'), null);
});

QUnit.asyncTest('invalid action', function() {
    request.post(API + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=UnknownAction');
        QUnit.start();
    }).form({ 
        s: 'feed/http://feeds.feedburner.com/WSwI',
        ac: 'invalid',
        T: token,
        a: 'user/' + userId +  '/label/test'
    });
});

var host = 'http://example.com',
    path = '/feed.xml',
    url = host + path,
    tests = __dirname + '/../test_data';

QUnit.asyncTest('subscribe', function() {
    nock(host)
        .get(path)
        .replyWithFile(200, tests + '/old.xml');
    
    request.post(API + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: 'feed/' + url,
        ac: 'subscribe',
        T: token
    });
});