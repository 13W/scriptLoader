/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: scriptLoader
 * Date: 18.09.14 0:46
 */

exports.asyncFunc = function async(logger, done) {
    logger.info('loading async module');
    setTimeout(function () {
        logger.info('async module loaded');
        done(null, 'hello world');
    }, 1000);
};
