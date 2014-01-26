/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: scriptLoader
 * Date: 25.01.14 23:41
 */

exports.$longggg = function inject() {
    console.log('Invoked!!!');
    var z = {}, i;
    for (i = 0; i < 1000000; ) {i += 1;}
    return z;
};