var Loader = require('../').Loader,
    loader = new Loader('AsyncApp', {log: {level: 'trace'}});

loader.load('./async');
