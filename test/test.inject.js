exports.$api = function inject(logger, $circle, cache) {
    logger.info('$api injected---!!!', $circle);
    logger.info('cache has key with value: "%s"', cache.key);
    return 'My Api!!!';
};

/*
exports.$app = function exec($api, logger, $circle) {
    logger.info('App executed, api: %s', $api, $circle);
};
*/

exports.$circle = function inject(logger, $api) {
    logger.info('$circle injected---!!!', $api);
    return 'My $circle!!!';
};