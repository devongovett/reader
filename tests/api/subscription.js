var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    nock = require('nock'),
    shared = require('../shared'),
    fs = require('fs'),
    request = shared.request;
    
var host = 'http://example.com',
    path = '/feed.xml',
    url = host + path,
    tests = __dirname + '/../test_data';

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
        assert.ok(/json/.test(res.headers['content-type']));

        body = JSON.parse(body);
        assert.equal(body.query, 'http://example.com/feed3.xml');
        assert.equal(body.numResults, 1);
        assert.equal(body.streamId, 'feed/http://example.com/feed3.xml');
        
        QUnit.start();
    }).form({ 
        quickadd: 'http://example.com/feed3.xml',
        T: shared.token
    });
});

QUnit.asyncTest('quickadd invalid', function() {
    request.post(shared.api + '/subscription/quickadd', function(err, res, body) {
        assert.equal(res.statusCode, 200); // Google Reader sends 200 response on invalid feed
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(body.query, 'invalid');
        assert.equal(typeof body.numResults, 'number');
        QUnit.start();
    }).form({ 
        quickadd: 'invalid',
        T: shared.token
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
        assert.equal(body, 'Error=InvalidOPML');
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

QUnit.asyncTest('subscription OPML import empty', function() {
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

QUnit.asyncTest('subscription OPML import', function() {
    nock('http://example.com/')
        .get('/opml.xml')
        .replyWithFile(200, tests + '/old.xml');
    
    // subscribes to one new feed and one existing feed, in the "OPML Folder" tag, and sets their titles
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        QUnit.start();
    }).form();
    
    form.append('T', shared.token);
    form.append('action', 'opml-upload');
    form.append('opml-file', fs.createReadStream(tests + '/test.opml'), {
        header: '--' + form.getBoundary() + '\r\n' +
                'Content-Disposition: form-data; name="opml-file"; filename="test.opml"\r\n' +
                'Content-Type: text/xml\r\n\r\n'
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
                title: 'OPML Feed 2',
                firstitemmsec: 0,
                categories: [{
                    id: 'user/' + shared.userID + '/label/OPML Folder',
                    label: 'OPML Folder'
                }, {
                    id: 'user/' + shared.userID + '/label/bar',
                    label: 'bar'
                }]
            }, {
                id: 'feed/http://example.com/feed3.xml',
                title: 'OPML Feed 3',
                firstitemmsec: 0,
                categories: []
            }, {
                id: 'feed/http://example.com/opml.xml',
                title: 'OPML Feed 1',
                firstitemmsec: 0,
                categories: [{
                    id: 'user/' + shared.userID + '/label/OPML Folder',
                    label: 'OPML Folder'
                }]
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

QUnit.asyncTest('subscription OPML export', function() {
    var OPMLParser = require('opmlparser');
    
    request(shared.server + '/reader/subscriptions/export')
        .on('response', function(res) {
            assert.equal(res.statusCode, 200);
            assert.equal(res.headers['content-type'], 'text/xml; charset=UTF-8');
            
            // doesn't exactly match Google Reader. they have no quotes or space after ;, but I think this should still work
            assert.equal(res.headers['content-disposition'], 'attachment; filename="google-reader-subscriptions.xml"');
        })
        .pipe(new OPMLParser({ addmeta: false }))
        .on('error', function(err) {
            assert.ok(false, 'OPML parse error');
        })
        .on('meta', function(meta) {
            assert.equal(meta.title, 'test subscriptions');
            assert.equal(meta['#version'], '1.0');
        })
        .on('outline', function(outline) {
            // sort the feeds and folders so we can compare them reliably
            outline.sort(function(a, b) {
                return a.title < b.title ? -1 : 1;
            }).forEach(function(n) {
                if (n.outline) {
                    n.outline.sort(function(a, b) {
                        return a.title < b.title ? -1 : 1;
                    });
                }
            });
            
            assert.deepEqual(outline, [{
                text: 'OPML Feed 3',
                title: 'OPML Feed 3',
                type: 'rss',
                xmlurl: 'http://example.com/feed3.xml',
                htmlurl: 'http://example.com/',
                folder: ''
            }, {
                title: 'OPML Folder',
                text: 'OPML Folder',
                outline: [{
                    text: 'OPML Feed 1',
                    title: 'OPML Feed 1',
                    type: 'rss',
                    xmlurl: 'http://example.com/opml.xml',
                    htmlurl: 'http://example.com/',
                    folder: 'OPML Folder'
                }, {
                    text: 'OPML Feed 2',
                    title: 'OPML Feed 2',
                    type: 'rss',
                    xmlurl: 'http://example.com/feed2.xml',
                    htmlurl: 'http://example.com/',
                    folder: 'OPML Folder'
                }]
            }, {
                title: 'bar',
                text: 'bar',
                outline: [{
                    text: 'Edited title',
                    title: 'Edited title',
                    type: 'rss',
                    xmlurl: 'http://example.com/feed1.xml',
                    htmlurl: 'http://example.com/',
                    folder: 'bar'
                }, {
                    text: 'OPML Feed 2',
                    title: 'OPML Feed 2',
                    type: 'rss',
                    xmlurl: 'http://example.com/feed2.xml',
                    htmlurl: 'http://example.com/',
                    folder: 'bar'
                }]
            }, {
                title: 'foo',
                text: 'foo',
                outline: [{
                    text: 'Test Blog',
                    title: 'Test Blog',
                    type: 'rss',
                    xmlurl: 'http://example.com/feed.xml',
                    htmlurl: 'http://example.com/',
                    folder: 'foo'
                }]
            }, {
                title: 'test',
                text: 'test',
                outline: [{
                    text: 'Test Blog',
                    title: 'Test Blog',
                    type: 'rss',
                    xmlurl: 'http://example.com/feed.xml',
                    htmlurl: 'http://example.com/',
                    folder: 'test'
                }]
            }])
        })
        .on('end', function() {
            QUnit.start();
        });
});