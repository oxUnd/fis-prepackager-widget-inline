/**
 * fis.baidu.com
 * DESC:
 * {%widget name="demo:a.tpl" inline%}
 *  =>
 * {%widget_inline%}<!--[inline /a.tpl]-->{%/widget_inline%}
 */


'use strict';

var ld, rd, include;

function pregQuote (str, delimiter) {
    // http://kevin.vanzonneveld.net
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

function _replace(id, properties) {
    id = id || '';
    properties = properties || '';
    var p;
    if ((p = id.indexOf(':')) !== -1) {
        id = '/' + id.substr(p + 1);
    }
    return ld + 'widget_inline ' + properties + rd          /*start*/
            + '<!--inline[' + id + ']-->'  /*内嵌语句*/
            + ld + '/widget_inline' + rd;                   /*end*/
}

function replaceWidget(content) {
    var inline_re = /\binline\b/i
        , escape_ld = pregQuote(ld)
        , escape_rd = pregQuote(rd)
        , widget_re = new RegExp(escape_ld + 'widget(?:((?=\\s)[\\s\\S]*?["\'\\s\\w])'+escape_rd+'|'+escape_rd+')', 'ig');
    return content.replace(widget_re, function(m, properties) {
        if (properties) {
            m = properties.replace(/^([\s\S]*?)name\s*=\s*['"]([\s\S]*?)["']([\s\S]*?)$/i, function($0, $1, $2, $3) {
                if (inline_re.test(properties)) {
                    return _replace($2, ($1 + $3).replace(inline_re, '').trim());
                } else if (include && Object.prototype.toString.apply(include) == '[object RegExp]') {
                    if (include.test($2)) {
                        return  _replace($2, $1 + $3);
                    }
                }
                return m;
            });

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

    return replaceWidget(content);
};
