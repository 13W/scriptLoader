/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: scriptLoader
 * Date: 25.01.14 23:40
 */
var Loader = require('../').Loader,
    loader = new Loader('myApp');

loader.load('./nested');

loader.invoke(function qew(injector, $longggg) {
    console.log(injector('$longggg') === $longggg);
});
