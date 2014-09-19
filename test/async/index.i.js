/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: scriptLoader
 * Date: 18.09.14 0:48
 */

exports.start = function exec(asyncFunc, logger) {
    logger.info({result: asyncFunc}, 'Async loading completed!');
};
