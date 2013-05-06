var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    shared = require('../shared'),
    request = shared.request;
    
QUnit.module('Tag');

QUnit.asyncTest('rename tag', function() {
    request.post(shared.api + '/rename-tag', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        s: 'user/-/label/test',
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
    require('../../src/db').Post.find(function(err, posts) {
        request.post(shared.api + '/edit-tag', function(err, res, body) {
            assert.equal(res.statusCode, 200);
            assert.equal(body, 'OK');
            QUnit.start();
        }).form({
            T: shared.token,
            i: 'tag:google.com,2005:reader/item/' + posts[0].id,
            a: 'user/-/label/folder1',
            r: 'user/-/state/com.google/starred'
        });
    });
});

QUnit.asyncTest('mark all as read feed', function() {
    request.post(shared.api + '/mark-all-as-read', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        s: 'feed/http://example.com/feed3.xml'
    });
});

QUnit.asyncTest('mark all as read post tag', function() {
    request.post(shared.api + '/mark-all-as-read', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        s: 'user/-/label/folder1'
    });
});

QUnit.asyncTest('mark all as read subscription tag', function() {
    request.post(shared.api + '/mark-all-as-read', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        s: 'user/-/label/foo'
    });
});

QUnit.asyncTest('mark all as read timestamp', function() {
    request.post(shared.api + '/mark-all-as-read', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({
        T: shared.token,
        s: 'feed/http://example.com/feed1.xml',
        ts: 1362670667
    });
});

QUnit.asyncTest('list tags unauthenticated', function() {
    request(shared.api + '/tag/list', { headers: {}}, function(err, res, body) {
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
        
        // test sortids
        body.tags.forEach(function(tag) {
            assert.equal(typeof tag.sortid, 'string');
            assert.equal(tag.sortid.length, 8);
            assert.ok(/[0-9A-F]/i.test(tag.sortid));
            delete tag.sortid;
        });
    
        // assume that the subscription tests have already run
        assert.deepEqual(body, {
            tags: [
                { id: 'user/' + shared.userID + '/label/OPML Folder' },
                { id: 'user/' + shared.userID + '/label/bar' },
                { id: 'user/' + shared.userID + '/label/baz' },
                { id: 'user/' + shared.userID + '/label/folder1' },
                { id: 'user/' + shared.userID + '/label/foo' },
                { id: 'user/' + shared.userID + '/state/com.google/read' }
            ]
        });
    
        QUnit.start();
    });
});

QUnit.asyncTest('unread count', function() {
    request(shared.api + '/unread-count', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
    
        body = JSON.parse(body);        
        body.unreadcounts.sort(function(a, b) {
            return a.id <= b.id ? -1 : 1;
        });
        
        assert.deepEqual(body, {
            max: 1000,
            unreadcounts: [{
                id: 'feed/http://example.com/feed1.xml',
                count: 2,
                newestItemTimestampUsec: 0 // TODO
            }, {
                id: 'feed/http://example.com/feed2.xml',
                count: 5,
                newestItemTimestampUsec: 0
            }, {
                id: 'feed/http://example.com/opml.xml',
                count: 3,
                newestItemTimestampUsec: 0
            }, {
                id: 'user/' + shared.userID + '/label/OPML Folder',
                count: 8,
                newestItemTimestampUsec: 0
            }, {
                id: 'user/' + shared.userID + '/label/bar',
                count: 7,
                newestItemTimestampUsec: 0
            }, {
                id: 'user/' + shared.userID + '/state/com.google/reading-list',
                count: 10,
                newestItemTimestampUsec: 0
            }]
        });
    
        QUnit.start();
    });
});