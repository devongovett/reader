var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    request = require('request'),
    utils = require('../../src/utils'),
    shared = require('../shared');
    
QUnit.module('Tag');

QUnit.asyncTest('rename tag', function() {
    request.post(shared.api + '/rename-tag', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        s: 'user/-/label/bar',
        dest: 'user/-/label/updated'
    });
});

QUnit.asyncTest('delete tag', function() {
    request.post(shared.api + '/disable-tag', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        s: 'user/-/label/updated'
    });
});

QUnit.test('parseItems', function() {
    assert.deepEqual(utils.parseItems('6705009029382226760'), ['5d0cfa30041d4348']);
    assert.deepEqual(utils.parseItems('162170919393841362'), ['024025978b5e50d2']);
    assert.deepEqual(utils.parseItems('-355401917359550817'), ['fb115bd6d34a8e9f']);
    assert.deepEqual(
        utils.parseItems(['162170919393841362', '-355401917359550817']), 
        ['024025978b5e50d2', 'fb115bd6d34a8e9f']
    );
    
    assert.deepEqual(utils.parseItems('tag:google.com,2005:reader/item/5d0cfa30041d4348'), ['5d0cfa30041d4348']);
    assert.deepEqual(utils.parseItems([
        'tag:google.com,2005:reader/item/024025978b5e50d2',
        'tag:google.com,2005:reader/item/fb115bd6d34a8e9f'
    ]), ['024025978b5e50d2', 'fb115bd6d34a8e9f']);
    
    assert.deepEqual(utils.parseItems(null), null);
    assert.deepEqual(utils.parseItems('dfjgdf'), null);
    assert.deepEqual(utils.parseItems(['024025978b5e50d2', null]), null);
    assert.deepEqual(utils.parseItems('0458y'), null);
    assert.deepEqual(utils.parseItems('12-2'), null);
});

QUnit.asyncTest('edit tag invalid item', function() {
    request.post(shared.api + '/edit-tag', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidItem');
        QUnit.start();
    }).form({
        T: shared.token,
        i: 'invalid',
        s: 'feed/http://www.engadget.com/rss.xml',
        a: 'user/-/label/folder1',
        r: 'user/-/state/com.google/starred'
    });
});

QUnit.asyncTest('edit tag invalid stream', function() {
    request.post(shared.api + '/edit-tag', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    }).form({
        T: shared.token,
        i: '1386864356855952360',
        s: 'feed/invalid',
        a: 'user/-/label/folder1',
        r: 'user/-/state/com.google/starred'
    });
});

QUnit.asyncTest('edit tag unknown count', function() {
    request.post(shared.api + '/edit-tag', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=UnknownCount');
        QUnit.start();
    }).form({
        T: shared.token,
        i: ['1386864356855952360', 'tag:google.com,2005:reader/item/fb115bd6d34a8e9f'],
        s: 'feed/http://www.engadget.com/rss.xml',
        a: 'user/-/label/folder1',
        r: 'user/-/state/com.google/starred'
    });
});

QUnit.asyncTest('edit tag', function() {
    request.post(shared.api + '/edit-tag', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        i: 'tag:google.com,2005:reader/item/fb115bd6d34a8e9f',
        s: 'feed/http://www.engadget.com/rss.xml',
        a: 'user/-/label/folder1',
        r: 'user/-/state/com.google/starred'
    });
});

QUnit.asyncTest('list tags unauthenticated', function() {
    request(shared.api + '/tag/list', { jar: false }, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        assert.equal(body, 'Error=AuthRequired');
        QUnit.start();
    });
});

QUnit.asyncTest('list tags', function() {
    request(shared.api + '/tag/list', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
    
        body = JSON.parse(body);
    
        // the results can come back in different orders, so sort them
        body.tags.sort(function(a, b) {
            return a.id <= b.id ? -1 : 1;
        });
    
        // assume that the subscription tests have already run
        assert.deepEqual(body, {
            tags: [
                { id: 'user/' + shared.userID + '/label/baz',  sortID: 0 },
                { id: 'user/' + shared.userID + '/label/foo',  sortID: 0 },
                { id: 'user/' + shared.userID + '/label/test', sortID: 0 }
            ]
        });
    
        QUnit.start();
    });
});