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

QUnit.asyncTest('item contents missing item', function() {
    request(shared.api + '/stream/items/contents', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidItem');
        QUnit.start();
    });
});

QUnit.asyncTest('item contents invalid item', function() {
    request(shared.api + '/stream/items/contents?i=1386864356855952360', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidItem');
        QUnit.start();
    });
});

QUnit.asyncTest('item contents invalid output', function() {
    request(shared.api + '/stream/items/contents?i=15183366035062724894069358601&output=invalid', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidOutput');
        QUnit.start();
    });
});

QUnit.asyncTest('item contents unknown item', function() {
    request(shared.api + '/stream/items/contents?i=15183366035062724894069358601', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.direction, 'ltr');
        assert.equal(body.title, 'Untitled Subscription');
        assert.deepEqual(body.self, [{ href: shared.api + '/stream/items/contents?i=15183366035062724894069358601' }]);
        assert.equal(typeof body.updated, 'number');
        assert.deepEqual(body.items, []);
        
        QUnit.start();
    });
});

QUnit.asyncTest('item contents single item', function() {
    require('../../src/db').Feed.findOne({ feedURL: 'http://example.com/feed.xml' }).populate('posts').then(function(feed) {
        var post = feed.posts[0];
        request(shared.api + '/stream/items/contents?i=' + post.shortID, function(err, res, body) {
            assert.equal(res.statusCode, 200);
            assert.ok(/json/.test(res.headers['content-type']));
            
            body = JSON.parse(body);
            assert.equal(body.direction, 'ltr');
            assert.equal(body.id, 'feed/http://example.com/feed.xml')
            assert.equal(body.title, 'Test Blog');
            assert.deepEqual(body.self, [{ href: shared.api + '/stream/items/contents?i=' + post.shortID }]);
            assert.deepEqual(body.alternate, [{ href: 'http://example.com/', type: 'text/html' }]);
            assert.equal(typeof body.updated, 'number');
            assert.ok(Array.isArray(body.items));
            assert.equal(body.items.length, 1);
            
            var item = body.items[0];
            assert.equal(typeof item.crawlTimeMsec, 'string');
            assert.equal(typeof item.timestampUsec, 'string');
            assert.ok(/tag:google.com,2005:reader\/item\/[0-9a-f]+/.test(item.id));
            assert.deepEqual(item.categories.sort(), ['user/' + shared.userID + '/label/folder1', 'user/' + shared.userID + '/state/com.google/read']);
            assert.equal(item.title, 'A Test Post 1');
            assert.equal(item.published, 1362670667);
            assert.equal(item.updated, 1362670667);
            assert.deepEqual(item.alternate, [{ href: 'http://example.com/blog/1', type: 'text/html' }]);
            assert.deepEqual(item.content, { direction: 'ltr', content: 'This is the main content of post 1. Isn\'t it great?' });
            assert.equal(item.author, null);
            assert.deepEqual(item.likingUsers, []);
            assert.deepEqual(item.comments, []);
            assert.deepEqual(item.annotations, []);
            assert.deepEqual(item.origin, { streamId: 'feed/http://example.com/feed.xml', title: 'Test Blog', htmlUrl: 'http://example.com/' });
            
            QUnit.start();
        });
    });
});

QUnit.asyncTest('item contents multiple items', function() {
   require('../../src/db').Feed.findOne({ feedURL: 'http://example.com/feed.xml' }).populate('posts').then(function(feed) {
        var posts = feed.posts;
        var url = shared.api + '/stream/items/contents?i=' + posts[0].shortID + '&i=' + posts[1].shortID;
        request(url, function(err, res, body) {
            assert.equal(res.statusCode, 200);
            assert.ok(/json/.test(res.headers['content-type']));
            
            body = JSON.parse(body);
            assert.equal(body.direction, 'ltr');
            assert.equal(body.id, 'feed/http://example.com/feed.xml')
            assert.equal(body.title, 'Test Blog');
            assert.deepEqual(body.self, [{ href: url }]);
            assert.deepEqual(body.alternate, [{ href: 'http://example.com/', type: 'text/html' }]);
            assert.equal(typeof body.updated, 'number');
            assert.ok(Array.isArray(body.items));
            assert.equal(body.items.length, 2);
            
            body.items.forEach(function(item) {
                assert.equal(typeof item.crawlTimeMsec, 'string');
                assert.equal(typeof item.timestampUsec, 'string');
                assert.ok(/tag:google.com,2005:reader\/item\/[0-9a-f]+/.test(item.id));
                assert.ok(Array.isArray(item.categories));
                assert.equal(typeof item.title, 'string');
                assert.equal(typeof item.published, 'number');
                assert.equal(typeof item.updated, 'number');
                assert.ok(Array.isArray(item.alternate));
                assert.equal(item.alternate.length, 1);
                assert.ok(/^http:\/\/example.com\/blog\/[12]$/.test(item.alternate[0].href));
                assert.equal(item.alternate[0].type, 'text/html');
                assert.equal(typeof item.content, 'object');
                assert.equal(item.content.direction, 'ltr');
                assert.equal(typeof item.content.content, 'string');
                assert.equal(item.author, null);
                assert.deepEqual(item.likingUsers, []);
                assert.deepEqual(item.comments, []);
                assert.deepEqual(item.annotations, []);
                assert.equal(typeof item.origin, 'object');
                assert.deepEqual(Object.keys(item.origin), ['streamId', 'title', 'htmlUrl']);
            });
            
            QUnit.start();
        });
    });
});

QUnit.asyncTest('item contents post', function() {
    require('../../src/db').Feed.findOne({ feedURL: 'http://example.com/feed.xml' }).populate('posts').then(function(feed) {
        var post = feed.posts[0];
        request.post(shared.api + '/stream/items/contents', function(err, res, body) {
            assert.equal(res.statusCode, 200);
            assert.ok(/json/.test(res.headers['content-type']));
            
            body = JSON.parse(body);
            assert.equal(body.direction, 'ltr');
            assert.equal(body.id, 'feed/http://example.com/feed.xml')
            assert.equal(body.title, 'Test Blog');
            assert.deepEqual(body.self, [{ href: shared.api + '/stream/items/contents' }]);
            assert.deepEqual(body.alternate, [{ href: 'http://example.com/', type: 'text/html' }]);
            assert.equal(typeof body.updated, 'number');
            assert.ok(Array.isArray(body.items));
            assert.equal(body.items.length, 1);
            
            var item = body.items[0];
            assert.equal(typeof item.crawlTimeMsec, 'string');
            assert.equal(typeof item.timestampUsec, 'string');
            assert.ok(/tag:google.com,2005:reader\/item\/[0-9a-f]+/.test(item.id));
            assert.deepEqual(item.categories.sort(), ['user/' + shared.userID + '/label/folder1', 'user/' + shared.userID + '/state/com.google/read']);
            assert.equal(item.title, 'A Test Post 1');
            assert.equal(item.published, 1362670667);
            assert.equal(item.updated, 1362670667);
            assert.deepEqual(item.alternate, [{ href: 'http://example.com/blog/1', type: 'text/html' }]);
            assert.deepEqual(item.content, { direction: 'ltr', content: 'This is the main content of post 1. Isn\'t it great?' });
            assert.equal(item.author, null);
            assert.deepEqual(item.likingUsers, []);
            assert.deepEqual(item.comments, []);
            assert.deepEqual(item.annotations, []);
            assert.deepEqual(item.origin, { streamId: 'feed/http://example.com/feed.xml', title: 'Test Blog', htmlUrl: 'http://example.com/' });
            
            QUnit.start();
        }).form({ i: post.shortID });
    });
});

QUnit.asyncTest('item stream contents invalid stream', function() {
    request(shared.api + '/stream/contents/feed/unknown', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidStream');
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents invalid count', function() {
    request(shared.api + '/stream/contents/feed/http://example.com/feed1.xml?n=dfih', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidCount');
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents invalid old time', function() {
    request(shared.api + '/stream/contents/feed/http://example.com/feed1.xml?ot=dof', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidTime');
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents invalid new time', function() {
    request(shared.api + '/stream/contents/feed/http://example.com/feed1.xml?ot=123&nt=dff', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidTime');
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents invalid rank', function() {
    request(shared.api + '/stream/contents/feed/http://example.com/feed1.xml?n=20&ot=123&nt=234&r=c', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidRank');
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents invalid tag', function() {
    request(shared.api + '/stream/contents/feed/http://example.com/feed1.xml?n=20&ot=123&nt=234&r=n&xt=user/unknown', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidTag');
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents', function() {
    var url = shared.api + '/stream/contents/user/-/state/com.google/reading-list?n=20';
    request(url, function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.direction, 'ltr');
        assert.equal(body.id, 'user/' + shared.userID + '/state/com.google/reading-list');
        assert.equal(body.title, 'com.google/reading-list');
        assert.equal(typeof body.continuation, 'string');
        assert.deepEqual(body.self, [{ href: url }]);
        // assert.deepEqual(body.alternate, [{ href: 'http://example.com/', type: 'text/html' }]);
        assert.equal(typeof body.updated, 'number');
        assert.ok(Array.isArray(body.items));
        assert.equal(body.items.length, 16);
        
        var lastPublished = Infinity;
        body.items.forEach(function(item) {
            assert.equal(typeof item.crawlTimeMsec, 'string');
            assert.equal(typeof item.timestampUsec, 'string');
            assert.ok(/tag:google.com,2005:reader\/item\/[0-9a-f]+/.test(item.id));
            assert.ok(Array.isArray(item.categories));
            assert.equal(typeof item.title, 'string');
            assert.equal(typeof item.published, 'number');
            
            assert.ok(item.published <= lastPublished);
            lastPublished = item.published;
            
            assert.equal(typeof item.updated, 'number');
            assert.ok(Array.isArray(item.alternate));
            assert.equal(item.alternate.length, 1);
            assert.ok(typeof item.alternate[0].href, 'string');
            assert.equal(item.alternate[0].type, 'text/html');
            assert.equal(typeof item.content, 'object');
            assert.equal(item.content.direction, 'ltr');
            assert.equal(typeof item.content.content, 'string');
            assert.equal(item.author, null);
            assert.deepEqual(item.likingUsers, []);
            assert.deepEqual(item.comments, []);
            assert.deepEqual(item.annotations, []);
            assert.equal(typeof item.origin, 'object');
            assert.deepEqual(Object.keys(item.origin), ['streamId', 'title', 'htmlUrl']);
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents default count', function() {
    var url = shared.api + '/stream/contents/user/-/state/com.google/reading-list';
    request(url, function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.direction, 'ltr');
        assert.equal(body.id, 'user/' + shared.userID + '/state/com.google/reading-list');
        assert.equal(body.title, 'com.google/reading-list');
        assert.equal(typeof body.continuation, 'string');
        assert.deepEqual(body.self, [{ href: url }]);
        assert.equal(typeof body.updated, 'number');
        assert.ok(Array.isArray(body.items));
        assert.equal(body.items.length, 16);
        
        var lastPublished = Infinity;
        body.items.forEach(function(item) {
            assert.equal(typeof item.crawlTimeMsec, 'string');
            assert.equal(typeof item.timestampUsec, 'string');
            assert.ok(/tag:google.com,2005:reader\/item\/[0-9a-f]+/.test(item.id));
            assert.ok(Array.isArray(item.categories));
            assert.equal(typeof item.title, 'string');
            assert.equal(typeof item.published, 'number');
            
            assert.ok(item.published <= lastPublished);
            lastPublished = item.published;
            
            assert.equal(typeof item.updated, 'number');
            assert.ok(Array.isArray(item.alternate));
            assert.equal(item.alternate.length, 1);
            assert.ok(typeof item.alternate[0].href, 'string');
            assert.equal(item.alternate[0].type, 'text/html');
            assert.equal(typeof item.content, 'object');
            assert.equal(item.content.direction, 'ltr');
            assert.equal(typeof item.content.content, 'string');
            assert.equal(item.author, null);
            assert.deepEqual(item.likingUsers, []);
            assert.deepEqual(item.comments, []);
            assert.deepEqual(item.annotations, []);
            assert.equal(typeof item.origin, 'object');
            assert.deepEqual(Object.keys(item.origin), ['streamId', 'title', 'htmlUrl']);
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents count', function() {
    var url = shared.api + '/stream/contents/user/-/state/com.google/reading-list?n=6';
    request(url, function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.direction, 'ltr');
        assert.equal(body.id, 'user/' + shared.userID + '/state/com.google/reading-list');
        assert.equal(body.title, 'com.google/reading-list');
        assert.equal(typeof body.continuation, 'string');
        assert.deepEqual(body.self, [{ href: url }]);
        assert.equal(typeof body.updated, 'number');
        assert.ok(Array.isArray(body.items));
        assert.equal(body.items.length, 6);
        
        var lastPublished = Infinity;
        body.items.forEach(function(item) {
            assert.equal(typeof item.crawlTimeMsec, 'string');
            assert.equal(typeof item.timestampUsec, 'string');
            assert.ok(/tag:google.com,2005:reader\/item\/[0-9a-f]+/.test(item.id));
            assert.ok(Array.isArray(item.categories));
            assert.equal(typeof item.title, 'string');
            assert.equal(typeof item.published, 'number');
            
            assert.ok(item.published <= lastPublished);
            lastPublished = item.published;
            
            assert.equal(typeof item.updated, 'number');
            assert.ok(Array.isArray(item.alternate));
            assert.equal(item.alternate.length, 1);
            assert.ok(typeof item.alternate[0].href, 'string');
            assert.equal(item.alternate[0].type, 'text/html');
            assert.equal(typeof item.content, 'object');
            assert.equal(item.content.direction, 'ltr');
            assert.equal(typeof item.content.content, 'string');
            assert.equal(item.author, null);
            assert.deepEqual(item.likingUsers, []);
            assert.deepEqual(item.comments, []);
            assert.deepEqual(item.annotations, []);
            assert.equal(typeof item.origin, 'object');
            assert.deepEqual(Object.keys(item.origin), ['streamId', 'title', 'htmlUrl']);
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents count', function() {
    var url = shared.api + '/stream/contents/feed/http://example.com/feed1.xml?ot=1362474204&nt=1362773793';
    request(url, function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.direction, 'ltr');
        assert.equal(body.id, 'feed/http://example.com/feed1.xml');
        assert.equal(body.title, 'Test Blog');
        assert.equal(body.description, 'A test blog that is so awesome');
        assert.equal(typeof body.continuation, 'string');
        assert.deepEqual(body.self, [{ href: url }]);
        assert.equal(typeof body.updated, 'number');
        assert.ok(Array.isArray(body.items));
        assert.equal(body.items.length, 4);
        
        var lastPublished = Infinity;
        body.items.forEach(function(item) {
            assert.equal(typeof item.crawlTimeMsec, 'string');
            assert.equal(typeof item.timestampUsec, 'string');
            assert.ok(/tag:google.com,2005:reader\/item\/[0-9a-f]+/.test(item.id));
            assert.ok(Array.isArray(item.categories));
            assert.equal(typeof item.title, 'string');
            assert.equal(typeof item.published, 'number');
            
            assert.ok(item.published <= lastPublished);
            lastPublished = item.published;
            
            assert.equal(typeof item.updated, 'number');
            assert.ok(Array.isArray(item.alternate));
            assert.equal(item.alternate.length, 1);
            assert.ok(typeof item.alternate[0].href, 'string');
            assert.equal(item.alternate[0].type, 'text/html');
            assert.equal(typeof item.content, 'object');
            assert.equal(item.content.direction, 'ltr');
            assert.equal(typeof item.content.content, 'string');
            assert.equal(item.author, null);
            assert.deepEqual(item.likingUsers, []);
            assert.deepEqual(item.comments, []);
            assert.deepEqual(item.annotations, []);
            assert.equal(typeof item.origin, 'object');
            assert.deepEqual(Object.keys(item.origin), ['streamId', 'title', 'htmlUrl']);
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents ranking', function() {
    var url = shared.api + '/stream/contents/feed/http://example.com/feed1.xml?r=o';
    request(url, function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.direction, 'ltr');
        assert.equal(body.id, 'feed/http://example.com/feed1.xml');
        assert.equal(body.title, 'Test Blog');
        assert.equal(body.description, 'A test blog that is so awesome');
        assert.equal(typeof body.continuation, 'string');
        assert.deepEqual(body.self, [{ href: url }]);
        assert.equal(typeof body.updated, 'number');
        assert.ok(Array.isArray(body.items));
        assert.equal(body.items.length, 5);
        
        var lastPublished = 0;
        body.items.forEach(function(item) {
            assert.equal(typeof item.crawlTimeMsec, 'string');
            assert.equal(typeof item.timestampUsec, 'string');
            assert.ok(/tag:google.com,2005:reader\/item\/[0-9a-f]+/.test(item.id));
            assert.ok(Array.isArray(item.categories));
            assert.equal(typeof item.title, 'string');
            assert.equal(typeof item.published, 'number');
            
            assert.ok(item.published >= lastPublished);
            lastPublished = item.published;
            
            assert.equal(typeof item.updated, 'number');
            assert.ok(Array.isArray(item.alternate));
            assert.equal(item.alternate.length, 1);
            assert.ok(typeof item.alternate[0].href, 'string');
            assert.equal(item.alternate[0].type, 'text/html');
            assert.equal(typeof item.content, 'object');
            assert.equal(item.content.direction, 'ltr');
            assert.equal(typeof item.content.content, 'string');
            assert.equal(item.author, null);
            assert.deepEqual(item.likingUsers, []);
            assert.deepEqual(item.comments, []);
            assert.deepEqual(item.annotations, []);
            assert.equal(typeof item.origin, 'object');
            assert.deepEqual(Object.keys(item.origin), ['streamId', 'title', 'htmlUrl']);
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents exclude', function() {
    var url = shared.api + '/stream/contents/feed/http://example.com/feed.xml?xt=user/-/label/folder1';
    request(url, function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.direction, 'ltr');
        assert.equal(body.id, 'feed/http://example.com/feed.xml');
        assert.equal(body.title, 'Test Blog');
        assert.equal(body.description, 'A test blog that is so awesome');
        assert.equal(typeof body.continuation, 'string');
        assert.deepEqual(body.self, [{ href: url }]);
        assert.equal(typeof body.updated, 'number');
        assert.ok(Array.isArray(body.items));
        assert.equal(body.items.length, 2);
        
        var lastPublished = Infinity;
        body.items.forEach(function(item) {
            assert.equal(typeof item.crawlTimeMsec, 'string');
            assert.equal(typeof item.timestampUsec, 'string');
            assert.ok(/tag:google.com,2005:reader\/item\/[0-9a-f]+/.test(item.id));
            assert.ok(Array.isArray(item.categories));
            assert.equal(typeof item.title, 'string');
            assert.equal(typeof item.published, 'number');
            
            assert.ok(item.published <= lastPublished);
            lastPublished = item.published;
            
            assert.equal(typeof item.updated, 'number');
            assert.ok(Array.isArray(item.alternate));
            assert.equal(item.alternate.length, 1);
            assert.ok(typeof item.alternate[0].href, 'string');
            assert.equal(item.alternate[0].type, 'text/html');
            assert.equal(typeof item.content, 'object');
            assert.equal(item.content.direction, 'ltr');
            assert.equal(typeof item.content.content, 'string');
            assert.equal(item.author, null);
            assert.deepEqual(item.likingUsers, []);
            assert.deepEqual(item.comments, []);
            assert.deepEqual(item.annotations, []);
            assert.equal(typeof item.origin, 'object');
            assert.deepEqual(Object.keys(item.origin), ['streamId', 'title', 'htmlUrl']);
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents unknown feed', function() {
    var url = shared.api + '/stream/contents/feed/http://unknown.com/';
    request(url, function(err, res, body) {
        assert.equal(res.statusCode, 404);
        assert.equal(body, 'Error=FeedNotFound');
        QUnit.start();
    });
});

QUnit.asyncTest('item stream contents unknown tag', function() {
    var url = shared.api + '/stream/contents/user/-/label/unknown';
    request(url, function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.direction, 'ltr');
        assert.equal(body.id, 'user/' + shared.userID + '/label/unknown');
        assert.equal(body.title, 'unknown');
        assert.deepEqual(body.self, [{ href: url }]);
        assert.equal(typeof body.updated, 'number');
        assert.deepEqual(body.items, []);
        
        QUnit.start();
    });
});