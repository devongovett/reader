var feedparser = require('feedparser'),
    deepEqual = require('deep-equal'),
    EventEmitter = require('events').EventEmitter;

function Feeder(url, options) {
    options = options || {};
    this.url = url;
    this.interval = options.interval || 10; // interval to poll in minutes
    this.lastDate = options.startDate || 0;
    
    this.meta = null;
    this._posts = {};
    this._interval = null;
    this._headers = {};
}

Feeder.prototype = new EventEmitter;

// Starts listening for feed updates
Feeder.prototype.start = function() {
    var feeder = this;
    
    feeder.reload();
    feeder.once('meta', function(meta) {
        switch (meta.cloud.type) {
            case 'hub': // pubsubhubbub supported
                
            case 'rsscloud': // rsscloud supported
                
            default: // we have to poll
                var fn = feeder.reload.bind(feeder);
                feeder._interval = setInterval(fn, feeder.interval * 60 * 1000);
        }
    });
    
    return this;
};

// Stops listening for updates
Feeder.prototype.stop = function() {
    if (this._interval)
        clearInterval(this._interval);
        
    return this;
};

// Internal method to actually load the feed
Feeder.prototype.reload = function(callback) {
    var feeder = this,
        lastDate = feeder.lastDate;
    
    var parser = feedparser.parseUrl({
        url: feeder.url,
        headers: {
            'If-Modified-Since': feeder._headers['last-modified'],
            'If-None-Match': feeder._headers.etag
        }
    });
    
    parser.on('response', function(res) {
        feeder._headers = res.headers;
    });
    
    parser.on('error', function(err) {
        feeder.emit('error', err);
        if (callback) callback(err);
    });
    
    parser.on('meta', function(meta) {
        if (!deepEqual(meta, feeder.meta)) {
            feeder.meta = meta;
            feeder.emit('meta', meta);
        }
    });
    
    parser.on('article', function(post) {
        var id = post.guid || post.link;
        
        if (!feeder._posts[id] && post.pubDate > feeder.lastDate)
            feeder.emit('post', post);
            
        else if (post.date > feeder.lastDate)
            feeder.emit('update', post);
            
        feeder._posts[id] = true;
        lastDate = Math.max(lastDate, post.date);
    });
    
    parser.on('end', function() {
        feeder.lastDate = lastDate;
        feeder.emit('loadEnd');
        if (callback) callback(null);
    });
    
    return this;
};

exports.Feeder = Feeder;

// creates and starts a Feeder instance in one call
exports.subscribe = function(url, options) {
    var feeder = new Feeder(url, options);

    process.nextTick(function() {
        feeder.start();
    });
    
    return feeder;
};