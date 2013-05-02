var mongoose = require('mongoose'),
    xml = require('libxmljs'),
    bignum = require('bignum'),
    crypto = require('crypto');

exports.ref = function(type) {
    return {
        type: mongoose.Schema.Types.ObjectId,
        ref: type
    };
};

exports.respond = function(res, response, defaultFormat) {
    var format = res.req.query.output || defaultFormat || 'json';
    
    switch (format) {
        case 'json':
            return res.json(response);
            
        case 'xml':
            var doc = new xml.Document();
            generateXML(doc, response);
            return res.type('xml').send(doc.toString());
            
        default: 
            res.send(400, 'Invalid output format');
    }
};

function generateXML(parent, object) {
    if (Array.isArray(object)) {
        var node = parent.node('list');
        
        object.forEach(function(item) {
            generateXML(node, item);
        });
    } else if (typeof object === 'object') {
        var node = parent.node('object');
        
        for (var key in object) {
            generateXML(node, object[key]).attr({ name: key });
        }
    } else {
        var node = parent.node(typeof object, '' + object);
    }
    
    return node;
}

exports.checkAuth = function(req, res, checkToken) {
    if (!req.user) {
        res.send(401, 'Error=AuthRequired');
        return false;
    }
    
    if (!checkToken)
        return true;
    
    var ret = req.body.T &&
              req.body.T === req.session.token &&
              Date.now() < req.session.tokenExpiry;
              
    if (!ret) {
        res.set('X-Reader-Google-Bad-Token', 'true')
           .send(400, 'Error=InvalidToken');
    }
        
    return ret;
};

var Validator = require('validator').Validator;

// prevent validator from throwing errors, and instead return false on error
// FIXME: there has to be a better way to do this
var validator = new Validator;
validator.error = function() { return false; }

exports.parseFeeds = function(feeds) {
    if (!feeds)
        return null;
        
    if (!Array.isArray(feeds))
        feeds = [feeds];
        
    for (var i = 0; i < feeds.length; i++) {
        if (!/^feed\//.test(feeds[i]))
            return null;
            
        var url = feeds[i].slice(5);
        if (!validator.check(url).isUrl())
            return null;
            
        feeds[i] = url;
    }
    
    return feeds;
};

exports.isEmail = function(email) {
    return !!validator.check(email).isEmail();
};

exports.isUrl = function(url) {
    return !!validator.check(url).isUrl();
};

exports.parseTags = function(tags, user) {
    if (!tags)
        return null;
        
    if (!user)
        return [];
        
    if (!Array.isArray(tags))
        tags = [tags];
        
    for (var i = 0; i < tags.length; i++) {
        var match = /^user\/(.+)\/(state|label)\/(.+)$/.exec(tags[i]);
        
        // allow user/<userId>/state/foo and also user/-/state/foo
        if (!match || (match[1] !== user.id && match[1] != '-'))
            return null;
            
        tags[i] = {
            user: user,
            type: match[2],
            name: match[3]
        };
    }
    
    return tags;
};

exports.parseStreams = function(streams, user) {
    if (!streams)
        return null;
        
    if (!Array.isArray(streams))
        streams = [streams];
        
    for (var i = 0; i < streams.length; i++) {
        var urls = exports.parseFeeds(streams[i])
        
        if (urls) {
            streams[i] = {
                type: 'feed',
                value: urls[0]
            };
        } else {
            var tags = exports.parseTags(streams[i], user);
            if (!tags)
                return null;
                
            streams[i] = {
                type: 'tag',
                value: tags[0]
            }
        }
    }
    
    return streams;
};

exports.parseItems = function(items) {
    if (!items)
        return null;
        
    if (!Array.isArray(items))
        items = [items];
        
    for (var i = 0; i < items.length; i++) {
        // the short version is just a base-10 number
        if (/^-?[0-9]+$/.test(items[i])) {
            // use a bignum to convert the number to hex
            var num = bignum(items[i]);
            
            // if a negative value was given, we need to get an unsigned version
            if (num.lt(0)) {
                var buf = num.abs().toBuffer();
                for (var j = 0; j < buf.length; j++)
                    buf[j] = 0xff - buf[j];
                
                num = bignum.fromBuffer(buf).add(1);
            }
            
            items[i] = num.toString(16);
        } else {
            // the long version has a prefix and the id in hex
            var match = /^tag:google.com,2005:reader\/item\/([0-9a-f]+)$/.exec(items[i]);
            if (!match)
                return null;
            
            items[i] = match[1];
        }
    }
    
    return items;
};

exports.shortItemId = function(id) {
    var num = bignum(id, 16);
    
    // get a signed version if needed
    if (id[0] === 'f') {
        var buf = num.toBuffer();
        for (var j = 0; j < buf.length; j++)
            buf[j] = 0xff - buf[j];
        
        num = bignum.fromBuffer(buf).add(1).neg();
    }
    
    return num.toString(10);
};

exports.fullURL = function(req) {
    return req.protocol + '://' + req.headers.host + req.url;
};

exports.uid = function(length) {
    if (!length) length = 8;
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};