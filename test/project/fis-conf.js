fis.config.merge({
    namespace: 'demo',
    modules: {
        preprocessor: {
            tpl: 'widget-inline, extlang'
        }
    },
    settings: {
        preprocessor: {
            'widget-inline':  {
                include: /inline/i
            }
        }
    }
});
