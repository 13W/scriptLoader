var Loader = require('../').Loader,
    loader = new Loader('myApp'),
    Cache = {key: 'value'};

loader.registerWrapper(function cache() {
    return Cache;
});

loader.load('./');

var api = loader.get('$api');

loader.invoke(function qew($api, injector, $longggg) {
  console.log($api);
  console.log(api);
  console.log($api === api);
  console.log(injector('$longggg') === $longggg);
});

/*
var f1, f2;

setImmediate(function () {
    f1 = loader.get('$longggg');
});

setImmediate(function () {
    f2 = loader.get('$longggg');
});

setTimeout(function (){
    console.log('f1 === f2', f1 === f2);
}, 1000);
*/
