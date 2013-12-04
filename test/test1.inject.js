exports.$silent = function inject(logger, injector) {
    logger.info('hello world');
    logger.info('I"ll get %s', injector('$circle'));
    return function() {
        logger.info('Yeap, i"m silent!');
    };
};