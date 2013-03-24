var mongoose = require('mongoose'),
    xml = require('libxmljs');

exports.ref = function(type) {
    return {
        type: mongoose.Schema.Types.ObjectId,
        ref: type
    };
};

exports.respond = function(res, response) {
    var format = res.req.query.output || 'json';
    
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

exports.parseStreams = function(streams) {
    if (!streams)
        return null;
        
    if (!Array.isArray(streams))
        streams = [streams];
        
    for (var i = 0; i < streams.length; i++) {
        if (!/^feed\//.test(streams[i]))
            return null;
            
        var url = streams[i].slice(5);
        if (!validator.check(url).isUrl())
            return null;
            
        streams[i] = url;
    }
    
    return streams;
};

exports.parseTags = function(tags, user) {
    if (!tags)
        return null;
        
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

exports.findOrCreate = function(model, item, callback) {
    model.findOne(item, function(err, record) {
        if (err) 
            return callback(err);
            
        if (!record) {
            model.create(item, function(err, record) {
                callback(err, record);
            });
        } else {
            callback(null, record);
        }
    });
};