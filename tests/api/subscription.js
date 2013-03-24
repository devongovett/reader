var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    request = require('request'),
    nock = require('nock'),
    utils = require('../../src/utils'),
    shared = require('../shared');

QUnit.module('Subscription');

QUnit.asyncTest('subscribe unauthenticated', function() {
    request.post(shared.api + '/subscription/edit', { jar: false }, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        assert.equal(body, 'Error=AuthRequired');
        QUnit.start();
    }).form({ s: 'feed/http://feeds.feedburner.com/WSwI', ac: 'subscribe' });
});

QUnit.asyncTest('subscribe missing token', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidToken');
        QUnit.start();
    }).form({ s: 'feed/http://feeds.feedburner.com/WSwI', ac: 'subscribe' });
});

QUnit.asyncTest('subscribe invalid token', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidToken');
        QUnit.start();
    }).form({ s: 'feed/http://feeds.feedburner.com/WSwI', ac: 'subscribe', T: 'invalid' });
});

QUnit.asyncTest('subscribe missing stream', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    }).form({ ac: 'subscribe', T: shared.token });
});

QUnit.asyncTest('subscribe invalid stream', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    }).form({ s: 'http://feeds.feedburner.com/WSwI', ac: 'subscribe', T: shared.token });
});

QUnit.asyncTest('subscribe invalid url', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    }).form({ s: 'feed/invalid', ac: 'subscribe', T: shared.token });
});

QUnit.asyncTest('subscribe invalid tag', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidTag');
        QUnit.start();
    }).form({ 
        s: 'feed/http://feeds.feedburner.com/WSwI',
        ac: 'subscribe',
        T: shared.token,
        a: 'invalid'
    });
});

QUnit.asyncTest('subscribe invalid tags', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidTag');
        QUnit.start();
    }).form({ 
        s: 'feed/http://feeds.feedburner.com/WSwI',
        ac: 'subscribe',
        T: shared.token,
        a: ['user/' + shared.userID +  '/label/test', 'invalid'] // a valid one, and an invalid one
    });
});

// probably should be in a separate test module
QUnit.test('parseTags', function() {
    var user = { id: 'id' };
    
    assert.equal(utils.parseTags(null, user), null);
    assert.equal(utils.parseTags('invalid', user), null);
    assert.deepEqual(utils.parseTags('user/id/label/test', user), [
        { type: 'label', name: 'test', user: user }
    ]);
    
    // google reader also allows the shared.userID to be replaced with a -
    assert.deepEqual(utils.parseTags('user/-/label/test', user), [
        { type: 'label', name: 'test', user: user }
    ]);
    
    assert.deepEqual(utils.parseTags(['user/id/label/test', 'user/id/state/com.google/read'], user), [
        { type: 'label', name: 'test', user: user },
        { type: 'state', name: 'com.google/read', user: user }
    ]);
    
    assert.equal(utils.parseTags(['user/id/label/test', null], user), null);
    assert.equal(utils.parseTags(['user/id/label/test', 1], user), null);
    assert.equal(utils.parseTags(['user/id/label/test', 'invalid'], user), null);
});

QUnit.asyncTest('invalid action', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=UnknownAction');
        QUnit.start();
    }).form({ 
        s: 'feed/http://feeds.feedburner.com/WSwI',
        ac: 'invalid',
        T: shared.token,
        a: 'user/' + shared.userID +  '/label/test'
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
    
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: 'feed/' + url,
        ac: 'subscribe',
        T: shared.token
    });
});

QUnit.asyncTest('subscribe multiple', function() {
    nock(host)
        .get('/feed1.xml')
        .replyWithFile(200, tests + '/add_post.xml');
        
    nock(host)
        .get('/feed2.xml')
        .replyWithFile(200, tests + '/update_post.xml');
    
    nock(host)
        .get('/feed3.xml')
        .replyWithFile(200, tests + '/update_meta.xml');
    
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: [
            'feed/http://example.com/feed1.xml',
            'feed/http://example.com/feed2.xml',
            'feed/http://example.com/feed3.xml'
        ],
        ac: 'subscribe',
        T: shared.token
    });
});

QUnit.asyncTest('add tags', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: 'feed/' + url,
        ac: 'edit',
        T: shared.token,
        a: ['user/-/label/test', 'user/-/label/foo', 'user/-/label/bar', 'user/-/label/baz']
    });
});

QUnit.asyncTest('remove tags', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: 'feed/' + url,
        ac: 'edit',
        T: shared.token,
        r: ['user/-/label/bar', 'user/-/label/baz']
    });
});

QUnit.asyncTest('edit multiple', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: ['feed/http://example.com/feed1.xml', 'feed/http://example.com/feed2.xml'],
        ac: 'edit',
        T: shared.token,
        a: 'user/-/label/bar'
    });
});

QUnit.asyncTest('unsubscribe', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: 'feed/http://example.com/feed3.xml',
        ac: 'unsubscribe',
        T: shared.token
    });
});


QUnit.asyncTest('unsubscribe unknown', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: 'feed/http://foobar.com/',
        ac: 'unsubscribe',
        T: shared.token
    });
});

QUnit.asyncTest('quickadd', function() {
    nock(host)
        .get('/feed3.xml')
        .replyWithFile(200, tests + '/old.xml');
    
    request.post(shared.api + '/subscription/quickadd', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        quickadd: 'feed/http://example.com/feed3.xml',
        T: shared.token
    });
});

QUnit.asyncTest('quickadd invalid', function() {
    request.post(shared.api + '/subscription/quickadd', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    }).form({ 
        quickadd: 'feed/invalid',
        T: shared.token
    });
});

QUnit.asyncTest('subscription list', function() {
    request(shared.api + '/subscription/list', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        
        // the results can come back in different orders, so sort them
        body.subscriptions.sort(function(a, b) {
            return a.id <= b.id ? -1 : 1;
        }).forEach(function(sub) {
            sub.categories.sort(function(a, b) {
                return a.label <= b.label ? -1 : 1;
            });
        });
        
        assert.deepEqual(body, {
            subscriptions: [{
                id: 'feed/http://example.com/feed.xml',
                title: 'Test Blog',
                firstitemmsec: 0,
                sortid: 0,
                categories: [{
                    id: 'user/' + shared.userID + '/label/foo',
                    label: 'foo'
                }, {
                    id: 'user/' + shared.userID + '/label/test',
                    label: 'test'
                }]
            }, {
                id: 'feed/http://example.com/feed1.xml',
                title: 'Test Blog',
                firstitemmsec: 0,
                sortid: 0,
                categories: [{
                    id: 'user/' + shared.userID + '/label/bar',
                    label: 'bar'
                }]
            }, {
                id: 'feed/http://example.com/feed2.xml',
                title: 'Test Blog',
                firstitemmsec: 0,
                sortid: 0,
                categories: [{
                    id: 'user/' + shared.userID + '/label/bar',
                    label: 'bar'
                }]
            }, {
                id: 'feed/http://example.com/feed3.xml',
                title: 'Test Blog',
                firstitemmsec: 0,
                sortid: 0,
                categories: []
            }]
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('subscribed', function() {
    request(shared.api + '/subscribed?s=feed/http://example.com/feed1.xml', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'true');
        QUnit.start();
    });
});

QUnit.asyncTest('subscribed invalid', function() {
    request(shared.api + '/subscribed?s=feed/invalid', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    });
});

QUnit.asyncTest('subscribed unknown', function() {
    request(shared.api + '/subscribed?s=feed/http://unknown.com/', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'false');
        QUnit.start();
    });
});