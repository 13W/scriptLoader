var fs = require('fs'),
    path = require('path'),
    Logger = require('bunyan');

/**
 * Loader
 * @namespace config {Object}
 * @property config.name {String}
 * @property config.log {Object}
 */
function Loader(name, config) {
    if (!config) {
        config = {};
        if (typeof name === 'object') {
            config = name;
            name = config.name;
        }
    }
    if (!name) {
        throw new Error('name required');
    }

    if (!(this instanceof Loader)) {
        return new Loader(name, config);
    }

    this.name = name;
    this.config = config || {};
    this.functions = {};

    if (this.config.log instanceof Logger) {
        this.logger = this.config.log.child({
            loader: this.name
        });
    } else {
        this.logger = Logger.createLogger({
            name: name,
            level: 'info'
        });
    }
}

Loader.prototype.stages = ['inject', 'exec'];

//noinspection JSUnusedGlobalSymbols
/**
 * return new instance of Loader
 * @param {String} name the name of the new Logger instance
 * @param {Object} [config={}] Config
 * @returns {Loader}
 */
Loader.prototype.next = function (name, config) {
    config = config || {};
    config.log = config.log || this.logger;

    return new Loader(name, config);
};

Loader.prototype.wrappers = {};

/**Register function in loader scope
 * @throws {instance} without name
 * @param {Object} instance function or object with name
 * @param {Boolean} [silent=false] without injection
 * @namespace instance {Object|Function}
 * @property instance.name {String}
 */
Loader.prototype.registerFunction = function (instance, silent) {
    if (typeof instance === 'function') {
        if (!instance.name) {
            throw new Error('Function name required');
        }
        instance = {function: instance, name: instance.name};
    }

    if (this.functions[instance.name]) {
        this.logger.warn('"%s" redeclared, first declaration in: %s', instance.name, this.functions[instance.name].filename);
    }

    this.functions[instance.name] = instance;
    if (silent) {
        return this.functions[instance.name];
    }
    
    this.createInjections(this.functions[instance.name]);
    return this;
};

/**
 * get injected function
 * @param {String} name function name
 * @returns {*}
 */
Loader.prototype.get = function (name) {
    var instance = this.functions[name],
        result = instance;
    
    if (!instance && this.wrappers[name]) {
        instance = {exports: this.wrappers[name].call(this)};
    }
    
    if (instance) {
        if (instance.hasOwnProperty('exports')) {
            result = instance.exports;
        } else {
            result = this.invoke(instance);
        }
    }
    return result;
};

/**
 * Wrap called argument function
 * @param {*} wrapper Function with name
 * @namespace wrapper {Object}
 * @property wrapper.name {String}
 */
Loader.prototype.registerWrapper = function (wrapper) {
    if (!wrapper.name) {
        throw new Error('Wrapper must be a function with name');
    }
    
    if (this.wrappers[wrapper.name]) {
        this.logger.warn('Wrapper "%s" already registered', wrapper.name);
    } else {
        this.wrappers[wrapper.name] = wrapper;
    }
};

/**
 * Parse function, map arguments
 * @throws when injection not found
 * @param {*} instance
 * @namespace instance {Object}
 * @property instance.name {String}
 * @property instance.function {Function}
 * @property instance.injections {Array} Injections
 */
Loader.prototype.createInjections = function (instance) {
    if (!instance.exports) {
        var injections = [],
            args = instance.function.toString()
                .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
                .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
                .split(/,/)
                .filter(function(e) {
                    return !!e;
                }),
            i;

        for (i = 0; i < args.length; i+=1) {
            var name = args[i];
            if (this.wrappers[name]) {
                injections.push(this.wrappers[name].call(this, instance));
                continue;
            }

            if (!this.functions[name]) {
                throw new Error('Injector error, Function "' + name + '" not found\n\t'+instance.filename);
            }

            if (!this.functions[name].exports) {
                if (this.functions[name].completed === undefined) {
                    this.functions[name].completed = false;
                    this.functions[name].exports = this.invoke(this.functions[name]);
                    this.functions[name].completed = true;
                } else {
                    this.logger.warn('Circular dependency: %s => %s', instance.name, name);
                }
            } else {
                this.functions[name].completed = true;
            }

            if (!this.functions[name].completed) {
                injections.push(null);
            } else {
                injections.push(this.functions[name].exports);
            }
        }

        instance.injections = injections;
    }
};
/**
 * invoke function in loader scope
 * @namespace instance {Object}
 * @property instance.name {String} Function name
 * @property instance.function {Function}
 * @property instance.injections {Array} Injections
 * @returns {*}
 */
Loader.prototype.invoke = function(instance) {
    if (typeof instance === 'function') {
        if (!instance.name) {
            throw new Error('Function name required');
        }
        
        //noinspection JSValidateTypes
        return this.invoke({function: instance, name: instance.name});
    }

    this.createInjections(instance);
    var result = instance.exports;

    if (!instance.hasOwnProperty('exports')) {
        result = instance.function.apply(instance.scope, instance.injections);
        //noinspection JSUndefinedPropertyAssignment
        instance.exports = result;
    }
    return result;
};
/**
 * load files from directory
 * file must contain <b>.inject.js</b> name
 * @param {String} directory
 */
Loader.prototype.load = function (directory) {
    var queue = {},
        i;
    
    this.stages.forEach(function(stage) {
        queue[stage] = [];
    });
    
    function toQueue(filename) {
        var result = require(filename),
            name;
        for(name in result) {
            if (result.hasOwnProperty(name)) {
                var func = result[name],
                    funcName = func.name;
                if (funcName) {
                    var instance = {
                        filename: filename,
                        name: name,
                        scope: result,
                        function: func
                    };
                    queue[funcName] = queue[funcName] || [];
                    queue[funcName].push(instance);
                }
            }
        }
    }

    function openDirectory(dir) {
        var list = fs.readdirSync(dir);

        list.forEach(function(file) {
            file = path.resolve(dir, file);
            var stat = fs.lstatSync(file);
            if (stat.isDirectory()) {
                openDirectory(file);
            } else {
                if (/\.inject\.js$/.test(file)) {
                    toQueue(file);
                }
            }
        });
    }

    openDirectory(path.resolve(directory));
    
    for (i = 0; i < this.stages.length; i+=1) {
        var stage = this.stages[i];

        this.logger.fields.stage = stage;

        while(queue[stage].length) {
            var instance = queue[stage].shift();
            if (stage === 'inject') {
                queue.exec.unshift(this.registerFunction(instance, true));
            } else {
                this.invoke(instance);
            }
        }
        delete this.logger.fields.stage;
    }
};

var loader = new Loader('main');

loader.registerWrapper(function logger(instance) {
    var app = {};
    if (instance && instance.name) {
        app.app = instance.name;
    }
    return this.logger.child(app);
});

loader.registerWrapper(function injector() {
    return this.get.bind(this);
});

Loader.prototype.scope = {};
loader.registerWrapper(function scope() {
    this.scope[this.name] = this.scope[this.name] || {};
    return this.scope[this.name];
});

exports.Loader = Loader;
