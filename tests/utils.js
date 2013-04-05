var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    utils = require('../src/utils');
    
QUnit.module('Utils');

var user = { id: 'id' };
QUnit.test('parseTags', function() {
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

QUnit.test('parseFeeds', function() {
    assert.equal(utils.parseFeeds(null), null);
    assert.equal(utils.parseFeeds('invalid'), null);
    assert.equal(utils.parseFeeds('feed/invalid'), null);
    assert.equal(utils.parseFeeds('http://feeds.feedburner.com/WSwI'), null);
    assert.deepEqual(utils.parseFeeds('feed/http://feeds.feedburner.com/WSwI'), [
        'http://feeds.feedburner.com/WSwI'
    ]);
    
    assert.deepEqual(utils.parseFeeds([
        'feed/http://feeds.feedburner.com/WSwI',
        'feed/http://example.com/rss.xml'
    ]), [
        'http://feeds.feedburner.com/WSwI',
        'http://example.com/rss.xml'
    ]);
});

QUnit.test('parseStreams', function() {
    assert.equal(utils.parseStreams(null), null);
    assert.equal(utils.parseStreams('invalid'), null);
    
    assert.deepEqual(utils.parseStreams('user/id/label/test', user), [
        { type: 'tag', value: { type: 'label', name: 'test', user: user }}
    ]);
    
    assert.deepEqual(utils.parseStreams('feed/http://feeds.feedburner.com/WSwI'), [
        { type: 'feed', value: 'http://feeds.feedburner.com/WSwI' }
    ]);
    
    assert.deepEqual(utils.parseStreams([
        'feed/http://feeds.feedburner.com/WSwI',
        'user/-/label/test'
    ], user), [
        { type: 'feed', value: 'http://feeds.feedburner.com/WSwI' },
        { type: 'tag', value: { type: 'label', name: 'test', user: user }}
    ]);
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

QUnit.test('shortItemId', function() {
    assert.equal(utils.shortItemId('5d0cfa30041d4348'), '6705009029382226760');
    assert.equal(utils.shortItemId('024025978b5e50d2'), '162170919393841362');
    assert.equal(utils.shortItemId('fb115bd6d34a8e9f'), '-355401917359550817');
});