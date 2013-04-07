var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    shared = require('../shared'),
    request = shared.request;
    
QUnit.module('Preference');

QUnit.asyncTest('list none', function() {
    request(shared.api + '/preference/list', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.deepEqual(body, { prefs: [] });
        
        QUnit.start();
    });
});

QUnit.asyncTest('set', function() {
    request.post(shared.api + '/preference/set', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        k: 'custom-favicons-enabled',
        v: 'true'
    });
});

QUnit.asyncTest('set JSON', function() {
    request.post(shared.api + '/preference/set', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        k: 'lhn-prefs',
        v: JSON.stringify({
            subscriptions:   { ism: false, ssa: false, suc: true, sas: true },
            selectors:       { ism: true },
            friends:         { ism: true },
            recommendations: { ism: true }
        })
    });
});

QUnit.asyncTest('reset', function() {
    request.post(shared.api + '/preference/set', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        k: 'custom-favicons-enabled',
        v: 'false'
    });
});

QUnit.asyncTest('set invalid key', function() {
    request.post(shared.api + '/preference/set', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidKey');
        QUnit.start();
    }).form({
        T: shared.token,
        v: 'true'
    });
});

QUnit.asyncTest('set invalid value', function() {
    request.post(shared.api + '/preference/set', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidValue');
        QUnit.start();
    }).form({
        T: shared.token,
        k: 'custom-favicons-enabled'
    });
});

QUnit.asyncTest('list', function() {
    request(shared.api + '/preference/list', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.deepEqual(body, {
            prefs: [{
                id: 'custom-favicons-enabled',
                value: 'false'
            }, {
                id: 'lhn-prefs',
                value: '{"subscriptions":{"ism":false,"ssa":false,"suc":true,"sas":true},"selectors":{"ism":true},"friends":{"ism":true},"recommendations":{"ism":true}}'
            }]
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('stream list none', function() {
    request(shared.api + '/preference/stream/list', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.deepEqual(body, { streamprefs: {} });
        
        QUnit.start();
    });
});

QUnit.asyncTest('stream set missing stream', function() {
    request.post(shared.api + '/preference/stream/set', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    }).form({
        T: shared.token,
        k: 'is-expanded',
        v: 'true'
    });
});

QUnit.asyncTest('stream set invalid stream', function() {
    request.post(shared.api + '/preference/stream/set', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    }).form({
        T: shared.token,
        s: 'invalid',
        k: 'is-expanded',
        v: 'true'
    });
});

QUnit.asyncTest('stream set', function() {
    request.post(shared.api + '/preference/stream/set', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        s: 'user/-/label/bar',
        k: 'is-expanded',
        v: 'true'
    });
});

QUnit.asyncTest('stream reset', function() {
    request.post(shared.api + '/preference/stream/set', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        s: 'user/-/label/bar',
        k: 'is-expanded',
        v: 'false'
    });
});

QUnit.asyncTest('stream list', function() {
    request(shared.api + '/preference/stream/list', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.deepEqual(Object.keys(body), ['streamprefs']);
        assert.deepEqual(Object.keys(body.streamprefs), ['user/' + shared.userID + '/label/bar']);
        assert.deepEqual(body.streamprefs['user/' + shared.userID + '/label/bar'], [{
            id: 'is-expanded',
            value: 'false'
        }]);
        
        QUnit.start();
    });
});