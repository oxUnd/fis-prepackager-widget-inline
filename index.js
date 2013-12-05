/**
 * fis.baidu.com
 * DESC:
 * {%widget name="demo:a.tpl" inline%}
 *  =>
 * {%widget_inline%}<!--inline [/a.tpl]-->{%/widget_inline%}
 */


'use strict';

var ld, rd, include, exclude;

function pregQuote (str, delimiter) {
    // http://kevin.vanzonneveld.net
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

function _replace(id, properties) {
    id = id || '';
    properties = properties || '';
    var p, path = id;
    if ((p = id.indexOf(':')) !== -1) {
        var namespace = id.substr(0, p);
        //如果不是当前模块下的widget，滤过
        if (namespace != fis.config.get('namespace')) {
            return false;
        }
        path = '/' + id.substr(p + 1);
    }

    var file = fis.file(fis.project.getProjectPath() + '/' + path);
    if (file.exists() && file.isText()) {
         return ld + 'widget_inline ' + properties + rd          /*start*/
            + file.getContent()                             //content 
            + ld + 'require name="' + id + '"' + rd
            + ld + '/widget_inline' + rd;                   /*end*/

    }
    return false;
}

function hit(id, include, exclude) {
    var toString = Object.prototype.toString;
    return !(exclude && toString.apply(exclude) == '[object RegExp]' && exclude.test(id)) && (include && toString.apply(include) == '[object RegExp]' && include.test(id));
}

function replaceWidget(content) {
    var inline_re = /\s+inline(?:\s+|$)/i
        , escape_ld = pregQuote(ld)
        , escape_rd = pregQuote(rd)
        , widget_re = new RegExp(escape_ld + 'widget(?:((?=\\s)[\\s\\S]*?["\'\\s\\w\\]`])'+escape_rd+'|'+escape_rd+')', 'ig');
    return content.replace(widget_re, function(m, properties) {
        if (properties) {
            var info;
            properties = properties.replace(/\sname\s*=\s*('(?:[^\\'\n\r\f]|\\[\s\S])*'|"(?:[^\\"\r\n\f]|\\[\s\S])*"|\S+)/i, function($0, $1) {
                if ($1) {
                    info = fis.util.stringQuote($1);
                    $0 = '';
                }
                return $0;
            });
            if (info && info.rest) {
                var res;
                if (inline_re.test(properties)) {
                    res = _replace(info.rest, properties.replace(inline_re, '').trim());
                } else if (hit(info.rest, include, exclude)) {
                    res = _replace(info.rest, properties);
                }
                if (res) {
                    m = res;
                }
            }
        }
        return m;
    });
}

module.exports = function(content, file, conf) {
    if (file.rExt !== '.tpl') {
        return content;
    }

    ld = conf.left_delimiter || fis.config.get('settings.smarty.left_delimiter') || '{%';
    rd = conf.right_delimiter || fis.config.get('settings.smarty.right_delimiter') || '%}';

    //include
    include = conf.include || null;

    exclude = conf.exclude || null;

    return replaceWidget(content);
};
