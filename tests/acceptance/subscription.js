var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    shared = require('../shared'),
    settings = require('./settings'),
    fs = require('fs'),
    request = shared.request;

// Google reader requires some time between requests??? UGH
var start = QUnit.start.bind(QUnit);
QUnit.start = function() {
    setTimeout(start, 1000);
}
    
QUnit.module('Subscription');
    
var FEED1 = 'feed/http://rss.nytimes.com/services/xml/rss/nyt/GlobalHome.xml';
var FEED2 = 'feed/http://daringfireball.net/index.xml';
var FEED3 = 'feed/http://rss.cnn.com/rss/edition.rss';

QUnit.asyncTest('subscribe unauthenticated', function() {
    request.post(settings.api + '/subscription/edit', { headers: {}}, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        QUnit.start();
    }).form({ s: FEED1, ac: 'subscribe' });
});

QUnit.asyncTest('subscribe missing token', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ s: FEED1, ac: 'subscribe' });
});

QUnit.asyncTest('subscribe invalid token', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ s: FEED1, ac: 'subscribe', T: 'invalid' });
});

QUnit.asyncTest('subscribe missing stream', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ ac: 'subscribe', T: shared.token });
});

QUnit.asyncTest('subscribe invalid stream', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ s: FEED1.slice(5), ac: 'subscribe', T: shared.token });
});

QUnit.asyncTest('subscribe invalid url', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ s: 'feed/invalid', ac: 'subscribe', T: shared.token });
});

QUnit.asyncTest('subscribe invalid tag', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ 
        s: FEED1,
        ac: 'subscribe',
        T: shared.token,
        a: 'invalid'
    });
});

QUnit.asyncTest('subscribe invalid tags', function() {
     // send a valid tag, and an invalid one
    var req = request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ 
        s: FEED1,
        ac: 'subscribe',
        T: shared.token,
        a: 'user/' + shared.userID +  '/label/test'
    });
    
    // have to append manually since node-querystring doesn't allow duplicate parameters
    // and Google Reader doesn't accept bracket array notation.
    req.body += '&a=invalid';
});

QUnit.asyncTest('invalid action', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ 
        s: FEED1,
        ac: 'invalid',
        T: shared.token,
        a: 'user/-/label/test'
    });
});

QUnit.asyncTest('subscribe', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: FEED1,
        ac: 'subscribe',
        T: shared.token
    });
});

QUnit.asyncTest('subscribe multiple', function() {
    var req = request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: FEED1,
        ac: 'subscribe',
        T: shared.token
    });
    
    // manually add a more streams
    req.body += '&s=' + encodeURIComponent(FEED2) + '&s=' + encodeURIComponent(FEED3);
});

QUnit.asyncTest('add tags', function() {
    var req = request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: FEED1,
        ac: 'edit',
        T: shared.token,
        a: 'user/-/label/test'
    });
    
    req.body += '&a=' + encodeURIComponent('user/-/label/foo') + 
                '&a=' + encodeURIComponent('user/-/label/bar') + 
                '&a=' + encodeURIComponent('user/-/label/baz');
});

QUnit.asyncTest('remove tags', function() {
    var req = request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: FEED1,
        ac: 'edit',
        T: shared.token,
        r: 'user/-/label/bar'
    });
    
    req.body += '&r=' + encodeURIComponent('user/-/label/baz');
});

QUnit.asyncTest('edit title', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: FEED2,
        ac: 'edit',
        T: shared.token,
        t: 'Edited title'
    });
});

QUnit.asyncTest('edit multiple', function() {
    var req = request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: FEED2,
        ac: 'edit',
        T: shared.token,
        a: 'user/-/label/bar'
    });
    
    req.body.s += '&s=' + encodeURIComponent(FEED1);
});

QUnit.asyncTest('unsubscribe', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: FEED3,
        ac: 'unsubscribe',
        T: shared.token
    });
});


QUnit.asyncTest('unsubscribe unknown', function() {
    request.post(settings.api + '/subscription/edit', function(err, res, body) {
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
    request.post(settings.api + '/subscription/quickadd', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        // Google Reader doesn't send OK back...
        QUnit.start();
    }).form({
        quickadd: 'https://www.apple.com/main/rss/hotnews/hotnews.rss',
        T: shared.token
    });
});

QUnit.asyncTest('quickadd invalid', function() {
    request.post(settings.api + '/subscription/quickadd', function(err, res, body) {
        assert.equal(res.statusCode, 200); // WTF? Google Reader sends 200 response on invalid feed
        QUnit.start();
    }).form({ 
        quickadd: 'invalid',
        T: shared.token
    });
});