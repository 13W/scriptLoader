var Loader = require('../').Loader,
    loader = new Loader('myApp'),
    Cache = {key: 'value'};

loader.registerWrapper(function cache() {
    return Cache;
});

loader.load('./');