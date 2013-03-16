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
            res.status(400).send('Invalid output format');
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