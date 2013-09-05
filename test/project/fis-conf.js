fis.config.merge({
    namespace: 'demo',
    modules: {
        preprocessor: {
            tpl: 'inline,widget-inline, extlang'
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
