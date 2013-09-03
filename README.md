fis-preprocessor-widget-inline
==============================

fispc 提供widget inline功能

###配置
```
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
```

###使用

+ 调用widget时，如果有属性inline，则把调用的widget内嵌到调用这个widget的模板文件中。

```
{%widget name="demo:widget/widget_inline.tpl" inline%}
```
+ 调用widget时，如果name的属性值被配置的include正则命中，则widget内嵌。
