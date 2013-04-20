var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    nock = require('nock'),
    shared = require('../shared'),
    request = shared.request;

QUnit.module('Subscription');

QUnit.asyncTest('subscribe unauthenticated', function() {
    request.post(shared.api + '/subscription/edit', { headers: {}}, function(err, res, body) {
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

QUnit.asyncTest('edit title', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form({ 
        s: 'feed/http://example.com/feed1.xml',
        ac: 'edit',
        T: shared.token,
        t: 'Edited title'
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
                    id: 'user/' + shared.userID + '/label/foo',
                    label: 'foo'
                }, {
                    id: 'user/' + shared.userID + '/label/test',
                    label: 'test'
                }]
            }, {
                id: 'feed/http://example.com/feed1.xml',
                title: 'Edited title',
                firstitemmsec: 0,
                categories: [{
                    id: 'user/' + shared.userID + '/label/bar',
                    label: 'bar'
                }]
            }, {
                id: 'feed/http://example.com/feed2.xml',
                title: 'Test Blog',
                firstitemmsec: 0,
                categories: [{
                    id: 'user/' + shared.userID + '/label/bar',
                    label: 'bar'
                }]
            }, {
                id: 'feed/http://example.com/feed3.xml',
                title: 'Test Blog',
                firstitemmsec: 0,
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

QUnit.asyncTest('subscription OPML import unauthenticated', function() {
    var form = request.post(shared.server + '/reader/subscriptions/import', { headers: {}}, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        assert.equal(body, 'Error=AuthRequired');
        QUnit.start();
    }).form();
    
    form.append('T', shared.token);
    form.append('action', 'opml-upload');
    form.append('opml-file', '', {
        header: '--' + form.getBoundary() + '\r\n' +
        'Content-Disposition: form-data; name="opml-file"; filename="file.xml"\r\n' +
        'Content-Type: text/xml\r\n\r\n'
    });
});

QUnit.asyncTest('subscription OPML import missing token', function() {
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidToken');
        QUnit.start();
    }).form();
    
    form.append('action', 'opml-upload');
    form.append('opml-file', '', {
        header: '--' + form.getBoundary() + '\r\n' +
                'Content-Disposition: form-data; name="opml-file"; filename="file.xml"\r\n' +
                'Content-Type: text/xml\r\n\r\n'
    });
});

QUnit.asyncTest('subscription OPML import invalid token', function() {
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=InvalidToken');
        QUnit.start();
    }).form();
    
    form.append('T', 'invalid');
    form.append('action', 'opml-upload');
    form.append('opml-file', '', {
        header: '--' + form.getBoundary() + '\r\n' +
                'Content-Disposition: form-data; name="opml-file"; filename="file.xml"\r\n' +
                'Content-Type: text/xml\r\n\r\n'
    });
});

QUnit.asyncTest('subscription OPML import invalid action', function() {
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=UnknownAction');
        QUnit.start();
    }).form();
    
    form.append('T', shared.token);
    form.append('action', 'invalid');
    form.append('opml-file', '', {
        header: '--' + form.getBoundary() + '\r\n' +
                'Content-Disposition: form-data; name="opml-file"; filename="file.xml"\r\n' +
                'Content-Type: text/xml\r\n\r\n'
    });
});

QUnit.asyncTest('subscription OPML import missing file', function() {
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=MissingFile');
        QUnit.start();
    }).form();
    
    form.append('T', shared.token);
    form.append('action', 'opml-upload');
});

QUnit.asyncTest('subscription OPML import invalid file', function() {
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=Unknown');
        QUnit.start();
    }).form();
    
    form.append('T', shared.token);
    form.append('action', 'opml-upload');
    form.append('opml-file', '', {
        header: '--' + form.getBoundary() + '\r\n' +
                'Content-Disposition: form-data; name="opml-file"; filename="file.xml"\r\n' +
                'Content-Type: text/xml\r\n\r\n'
    });
});

QUnit.asyncTest('subscription OPML import', function() {
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form();
    
    form.append('T', shared.token);
    form.append('action', 'opml-upload');
    form.append('opml-file', '<opml version="1.0"></opml>', {
        header: '--' + form.getBoundary() + '\r\n' +
                'Content-Disposition: form-data; name="opml-file"; filename="file.xml"\r\n' +
                'Content-Type: text/xml\r\n\r\n'
    });
});

// TODO: test importing actual OPML files

QUnit.asyncTest('subscription OPML export', function() {
    request(shared.server + '/reader/subscriptions/export', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/xml/.test(res.headers['content-type']));
        
        // we can't just do a straight compare because the feeds may be in a different order
        // TODO: this is pretty hacky. there is probably a better way
        var lines = body.split('\n');
        assert.equal(20, lines.length);
        
        assert.deepEqual(lines.slice(0, 6), [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<opml version="1.0">',
            '  <head>',
            '    <title>test subscriptions</title>',
            '  </head>',
            '  <body>'
        ]);
        
        assert.ok(~body.indexOf([
            '    <outline title="foo" text="foo">',
            '      <outline text="Test Blog" title="Test Blog" type="rss" xmlUrl="http://example.com/feed.xml" htmlUrl="http://example.com/"/>',
            '    </outline>'
        ].join('\n')));
        
        assert.ok(~body.indexOf([
            '    <outline title="test" text="test">',
            '      <outline text="Test Blog" title="Test Blog" type="rss" xmlUrl="http://example.com/feed.xml" htmlUrl="http://example.com/"/>',
            '    </outline>',
        ].join('\n')));
        
        assert.ok(~body.indexOf([
            '    <outline title="bar" text="bar">',
            '      <outline text="Edited title" title="Edited title" type="rss" xmlUrl="http://example.com/feed1.xml" htmlUrl="http://example.com/"/>',
            '      <outline text="Test Blog" title="Test Blog" type="rss" xmlUrl="http://example.com/feed2.xml" htmlUrl="http://example.com/"/>',
            '    </outline>',
        ].join('\n')));
        
        assert.ok(~body.indexOf(
            '    <outline text="Test Blog" title="Test Blog" type="rss" xmlUrl="http://example.com/feed3.xml" htmlUrl="http://example.com/"/>'
        ));
        
        assert.deepEqual(lines.slice(17), [
            '  </body>',
            '</opml>',
            ''
        ]);
        
        QUnit.start();
    });
});