var mongoose = require('mongoose');

// TODO: wrap mongoose methods so they return promises
// then method that runs exec on the query
mongoose.Query.prototype.then = function(done, fail) {
    return this.exec().then(done, fail);
};

function wrap(obj, method) {
    var old = obj[method];
    obj[method] = function() {
        if (arguments.length && typeof arguments[arguments.length - 1] === 'function')
            return old.apply(this, arguments);
            
        var promise = new mongoose.Promise;
        var args = Array.prototype.slice.call(arguments);
        
        args.push(function(err, result) {
            promise.resolve(err, result);
        });
        
        old.apply(this, args);
        return promise;
    };
}

wrap(mongoose.Model.prototype, 'populate');
wrap(mongoose.Model, 'create');
wrap(mongoose.Model, 'populate');
wrap(mongoose.Model.prototype, 'save');
wrap(mongoose.Model.prototype, 'remove');

// mongoose's pre/post hooks overwrite the save and remove functions
// so we have to wrap those again to return promises
function hook(method) {
	var fn = mongoose.Document.prototype[method];
	mongoose.Document.prototype[method] = function(name) {
        var ret = fn.apply(this, arguments);
        var old = this[name];
        wrap(this, name);
        this[name].numAsyncPres = old.numAsyncPres;
        return ret;
	};
}

hook('pre');
hook('post');