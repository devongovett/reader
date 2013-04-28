var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    fs = require('fs'),
    shared = require('./shared'),
    request = shared.request;
    
QUnit.module('Subscription');
    
var FEED1 = 'feed/http://rss.nytimes.com/services/xml/rss/nyt/GlobalHome.xml';
var FEED2 = 'feed/http://daringfireball.net/index.xml';
var FEED3 = 'feed/http://rss.cnn.com/rss/edition.rss';
var FEED4 = 'https://www.apple.com/main/rss/hotnews/hotnews.rss';

QUnit.asyncTest('subscribe unauthenticated', function() {
    request.post(shared.api + '/subscription/edit', { headers: {}}, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        QUnit.start();
    }).form({ s: FEED1, ac: 'subscribe' });
});

QUnit.asyncTest('subscribe missing token', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ s: FEED1, ac: 'subscribe' });
});

QUnit.asyncTest('subscribe invalid token', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ s: FEED1, ac: 'subscribe', T: 'invalid' });
});

QUnit.asyncTest('subscribe missing stream', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ ac: 'subscribe', T: shared.token });
});

QUnit.asyncTest('subscribe invalid stream', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ s: FEED1.slice(5), ac: 'subscribe', T: shared.token });
});

QUnit.asyncTest('subscribe invalid url', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    }).form({ s: 'feed/invalid', ac: 'subscribe', T: shared.token });
});

QUnit.asyncTest('subscribe invalid tag', function() {
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
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
    var req = request.post(shared.api + '/subscription/edit', function(err, res, body) {
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
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
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
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
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
    var req = request.post(shared.api + '/subscription/edit', function(err, res, body) {
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
    var req = request.post(shared.api + '/subscription/edit', function(err, res, body) {
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
    var req = request.post(shared.api + '/subscription/edit', function(err, res, body) {
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
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
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
    var req = request.post(shared.api + '/subscription/edit', function(err, res, body) {
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
    request.post(shared.api + '/subscription/edit', function(err, res, body) {
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
    request.post(shared.api + '/subscription/quickadd', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        // assert.ok(/json/.test(res.headers['content-type'])); // Google Reader returns HTML? whaaa
        // Google Reader sends back search results maybe?
        body = JSON.parse(body);
        assert.equal(body.query, FEED4);
        assert.equal(body.numResults, 1);
        assert.equal(body.streamId, 'feed/' + FEED4);
        QUnit.start();
    }).form({
        quickadd: FEED4,
        T: shared.token
    });
});

QUnit.asyncTest('quickadd invalid', function() {
    request.post(shared.api + '/subscription/quickadd', function(err, res, body) {
        assert.equal(res.statusCode, 200); // Google Reader sends 200 response on invalid feed
        body = JSON.parse(body);
        assert.equal(body.query, 'invalid');
        assert.equal(typeof body.numResults, 'number');
        QUnit.start();
    }).form({ 
        quickadd: 'invalid',
        T: shared.token
    });
});

QUnit.asyncTest('subscription OPML import missing token', function() {
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 400);
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
        QUnit.start();
    }).form();
    
    form.append('T', shared.token);
    form.append('action', 'opml-upload');
});

QUnit.asyncTest('subscription OPML import invalid file', function() {
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        QUnit.start();
    }).form();
    
    form.append('T', shared.token);
    form.append('action', 'opml-upload');
    form.append('opml-file', 'invalid', {
        header: '--' + form.getBoundary() + '\r\n' +
                'Content-Disposition: form-data; name="opml-file"; filename="file.xml"\r\n' +
                'Content-Type: text/xml\r\n\r\n'
    });
});

QUnit.asyncTest('subscription OPML import empty', function() {
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        // assert.equal(body, 'OK'); // Google Reader responds with some JavaScript HTML page or something
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
    // subscribes to one new feed and one existing feed, in the "OPML Folder" tag, and sets their titles
    var form = request.post(shared.server + '/reader/subscriptions/import', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        // assert.equal(body, 'OK');
        QUnit.start();
    }).form();
    
    form.append('T', shared.token);
    form.append('action', 'opml-upload');
    form.append('opml-file', fs.createReadStream(__dirname + '/../test_data/real.opml'), {
        header: '--' + form.getBoundary() + '\r\n' +
                'Content-Disposition: form-data; name="opml-file"; filename="test.opml"\r\n' +
                'Content-Type: text/xml\r\n\r\n'
    });
});

// apparently xml is the default output format for this one... not consistent
// should we test for this?
QUnit.asyncTest('subscription list default output type', function() {
    request(shared.api + '/subscription/list', function(err, res, body) {
        assert.ok(/xml/.test(res.headers['content-type']));
        QUnit.start();
    });
});

QUnit.asyncTest('subscription list', function() {
    request(shared.api + '/subscription/list?output=json', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        // assert.ok(/json/.test(res.headers['content-type']));
        
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
            assert.ok(/^[0-9A-F]+$/i.test(sub.sortid));
            delete sub.sortid;
            
            // test firstitemmsec
            assert.equal(typeof sub.firstitemmsec, 'string');
            assert.ok(/^[0-9]+$/.test(sub.firstitemmsec));
            delete sub.firstitemmsec;
        });
        
        assert.deepEqual(body, {
            subscriptions: [{
                id: 'feed/http://daringfireball.net/index.xml',
                title: 'Edited title',
                htmlUrl: 'http://daringfireball.net/',
                categories: [
                    { id: 'user/' + shared.userID + '/label/bar', label: 'bar' }
                ]
            }, {
                id: 'feed/http://feeds.bbci.co.uk/news/rss.xml',
                title: 'BBC News - Home',
                htmlUrl: 'http://www.bbc.co.uk/news/#sa-ns_mchannel=rss&ns_source=PublicRSS20-sa',
                categories: []
            }, {
                id: 'feed/http://gdata.youtube.com/feeds/base/users/MontyPython/uploads?alt=rss&amp;v=2&amp;client=ytapi-youtube-profile',
                title: 'Uploads by MontyPython',
                htmlUrl: 'http://www.youtube.com/channel/UCGm3CO6LPcN-Y7HIuyE0Rew/videos',
                categories: [
                    { id: 'user/' + shared.userID + '/label/OPML Folder', label: 'OPML Folder' }
                ]
            }, {
                id: 'feed/http://rss.hulu.com/HuluPopularVideosThisMonth',
                title: 'Hulu Custom Title',
                htmlUrl: 'http://www.hulu.com/feed',
                categories: [
                    { id: 'user/' + shared.userID + '/label/OPML Folder', label: 'OPML Folder' }
                ]
            }, {
                id: 'feed/http://rss.nytimes.com/services/xml/rss/nyt/GlobalHome.xml',
                title: 'NYT > Global Home',
                htmlUrl: 'http://www.nytimes.com/pages/global/index.html?partner=rss&emc=rss',
                categories: [
                    { id: 'user/16672783126546743526/label/foo', label: 'foo' },
                    { id: 'user/16672783126546743526/label/test', label: 'test' }
                ]
            }, {
                id: 'feed/https://www.apple.com/main/rss/hotnews/hotnews.rss',
                title: 'Apple Hot News',
                categories: [],
                htmlUrl: 'http://www.apple.com/hotnews/'
            }]
        });
        
        QUnit.start();
    });
});

QUnit.asyncTest('subscribed', function() {
    request(shared.api + '/subscribed?s=' + FEED1, function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'true');
        QUnit.start();
    });
});

QUnit.asyncTest('subscribed invalid', function() {
    request(shared.api + '/subscribed?s=feed/invalid', function(err, res, body) {
        assert.equal(res.statusCode, 400);
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
            assert.ok(/^attachment;\s*filename="?google-reader-subscriptions.xml"?$/.test(res.headers['content-disposition']));
        })
        .pipe(new OPMLParser({ addmeta: false }))
        .on('error', function(err) {
            assert.ok(false, 'OPML parse error');
        })
        .on('meta', function(meta) {
            assert.equal(typeof meta.title, 'string');
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
                title: 'Apple Hot News',
                text: 'Apple Hot News',
                type: 'rss',
                xmlurl: 'https://www.apple.com/main/rss/hotnews/hotnews.rss',
                htmlurl: 'http://www.apple.com/hotnews/',
                folder: ''
            }, {
                text: 'BBC News - Home',
                title: 'BBC News - Home',
                type: 'rss',
                xmlurl: 'http://feeds.bbci.co.uk/news/rss.xml',
                htmlurl: 'http://www.bbc.co.uk/news/#sa-ns_mchannel=rss&ns_source=PublicRSS20-sa',
                folder: ''
            }, {
                title: 'OPML Folder',
                text: 'OPML Folder',
                outline: [{
                    text: 'Hulu Custom Title',
                    title: 'Hulu Custom Title',
                    type: 'rss',
                    xmlurl: 'http://rss.hulu.com/HuluPopularVideosThisMonth',
                    htmlurl: 'http://www.hulu.com/feed',
                    folder: 'OPML Folder'
                }, {
                    text: 'Uploads by MontyPython',
                    title: 'Uploads by MontyPython',
                    type: 'rss',
                    xmlurl: 'http://gdata.youtube.com/feeds/base/users/MontyPython/uploads?alt=rss&amp;v=2&amp;client=ytapi-youtube-profile',
                    htmlurl: 'http://www.youtube.com/channel/UCGm3CO6LPcN-Y7HIuyE0Rew/videos',
                    folder: 'OPML Folder'
                }]
            }, {
                title: 'bar',
                text: 'bar',
                outline: [{
                    text: 'Edited title',
                    title: 'Edited title',
                    type: 'rss',
                    xmlurl: 'http://daringfireball.net/index.xml',
                    htmlurl: 'http://daringfireball.net/',
                    folder: 'bar'
                }]
            }, {
                title: 'foo',
                text: 'foo',
                outline: [{
                    text: 'NYT > Global Home',
                    title: 'NYT > Global Home',
                    type: 'rss',
                    xmlurl: 'http://rss.nytimes.com/services/xml/rss/nyt/GlobalHome.xml',
                    htmlurl: 'http://www.nytimes.com/pages/global/index.html?partner=rss&emc=rss',
                    folder: 'foo'
                }]
            }, {
                title: 'test',
                text: 'test',
                outline: [{
                    text: 'NYT > Global Home',
                    title: 'NYT > Global Home',
                    type: 'rss',
                    xmlurl: 'http://rss.nytimes.com/services/xml/rss/nyt/GlobalHome.xml',
                    htmlurl: 'http://www.nytimes.com/pages/global/index.html?partner=rss&emc=rss',
                    folder: 'test'
                }]
            }]);
        })
        .on('end', function() {
            QUnit.start();
        });
});