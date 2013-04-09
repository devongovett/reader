var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    xml = require('libxmljs'),
    shared = require('../shared'),
    nock = require('nock'),
    request = shared.request;

// test that data for different users is separated properly
QUnit.module('Multiple Accounts');

QUnit.asyncTest('registration', function() {
    request.post(shared.server + '/accounts/register', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        
        QUnit.start();
    }).form({ Email: 'foo@test.com', Passwd: 'foo' });
});

QUnit.asyncTest('ClientLogin', function() {
    request.post(shared.server + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/SID=.+\n/.test(body));
        assert.ok(/LSID=.+\n/.test(body));
        assert.ok(/Auth=.+\n/.test(body));
        
        shared.setAuth(body.match(/Auth=(.+)/)[1]);
        QUnit.start();
    }).form({ Email: 'foo@test.com', Passwd: 'foo' });
});


QUnit.asyncTest('user-info', function() {
    request(shared.api + '/user-info', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(typeof body.userId, 'string');
        assert.equal(body.userName, 'foo');
        assert.equal(body.userProfileId, body.userId);
        assert.equal(body.userEmail, 'foo@test.com');
        assert.equal(body.isBloggerUser, false);
        assert.equal(typeof body.signupTimeSec, 'number');
        assert.equal(body.isMultiLoginEnabled, false);
        
        assert.equal(res.headers['x-reader-user'], body.userId);
        shared.userID = body.userId; // save for later
        
        QUnit.start();
    });
});

QUnit.asyncTest('token', function() {
    request(shared.api + '/token', function(err, res, body) {
        shared.token = body; // save for later
        
        assert.equal(res.statusCode, 200);
        assert.equal(body.length, 24);
        
        QUnit.start();
    });
});

QUnit.asyncTest('subscribe', function() {
    nock('http://test.com')
        .get('/different.xml')
        .replyWithFile(200, __dirname + '/../test_data/update_meta.xml');

    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: ['feed/http://example.com/feed.xml', 'feed/http://example.com/feed1.xml', 'feed/http://test.com/different.xml'],
        ac: 'subscribe',
        T: shared.token,
        a: ['user/-/label/tag', 'user/-/label/another']
    });
});

QUnit.asyncTest('edit subscription', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: 'feed/http://test.com/different.xml',
        ac: 'edit',
        T: shared.token,
        t: 'Brand New Title',
        r: 'user/-/label/another'
    });
});

QUnit.asyncTest('unsubscribe', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: 'feed/http://example.com/feed1.xml',
        ac: 'unsubscribe',
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
            
            // test sortids
            assert.equal(typeof sub.sortid, 'string');
            assert.equal(sub.sortid.length, 8);
            assert.ok(/[0-9A-F]/i.test(sub.sortid));
            delete sub.sortid;
        });
        
        assert.deepEqual(body, {
            subscriptions: [{
                id: 'feed/http://example.com/feed.xml',
                title: 'Test Blog',
                firstitemmsec: 0,
                categories: [{
                    id: 'user/' + shared.userID + '/label/another',
                    label: 'another'
                }, {
                    id: 'user/' + shared.userID + '/label/tag',
                    label: 'tag'
                }]
            }, {
                id: 'feed/http://test.com/different.xml',
                title: 'Brand New Title',
                firstitemmsec: 0,
                categories: [{
                    id: 'user/' + shared.userID + '/label/tag',
                    label: 'tag'
                }]
            }]
        });
        
        QUnit.start();
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
            a: 'user/-/state/com.google/starred'
        });
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
                { id: 'user/' + shared.userID + '/label/another' },
                { id: 'user/' + shared.userID + '/label/tag' },
                { id: 'user/' + shared.userID + '/state/com.google/starred' }
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
                id: 'feed/http://example.com/feed.xml',
                count: 3,
                newestItemTimestampUsec: 0
            }, {
                id: 'feed/http://test.com/different.xml',
                count: 5,
                newestItemTimestampUsec: 0
            }, {
                id: 'user/' + shared.userID + '/label/another',
                count: 3,
                newestItemTimestampUsec: 0
            }, {
                id: 'user/' + shared.userID + '/label/tag',
                count: 8,
                newestItemTimestampUsec: 0
            }, {
                id: 'user/' + shared.userID + '/state/com.google/reading-list',
                count: 8,
                newestItemTimestampUsec: 0
            }]
        });
    
        QUnit.start();
    });
});

QUnit.asyncTest('stream details', function() {
    request(shared.api + '/stream/details?s=feed/http://example.com/feed.xml', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.subscribers, '2');
        assert.equal(body.velocity, '0.0');
        assert.equal(typeof body.successfulCrawlTimeUsec, 'number');
        assert.equal(typeof body.failedCrawlTimeUsec, 'number');
        assert.equal(body.lastFailureWasParseFailure, false);
        assert.deepEqual(body.trendsCharts, {});
        assert.equal(body.feedUrl, 'http://example.com/feed.xml');
        
        QUnit.start();
    });
});

QUnit.asyncTest('item ids', function() {
    request(shared.api + '/stream/items/ids?s=user/-/state/com.google/reading-list&n=20', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.itemRefs.length, 8);
        
        QUnit.start();
    });
});

QUnit.asyncTest('item count', function() {
    request(shared.api + '/stream/items/count?s=user/-/state/com.google/reading-list', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, '8');
        QUnit.start();
    });
});