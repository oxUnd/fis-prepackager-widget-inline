/**
 * fis.baidu.com
 * DESC:
 * {%widget name="demo:a.tpl" inline%}
 *  =>
 * {%widget_inline%}<!--inline [/a.tpl]-->{%/widget_inline%}
 */


'use strict';

var ld, rd, include, exclude, config;



var exports = module.exports = function(content, file, conf) {
    if (file.rExt !== '.tpl') {
        return content;
    }

    ld = conf.left_delimiter || fis.config.get('settings.smarty.left_delimiter') || '{%';
    rd = conf.right_delimiter || fis.config.get('settings.smarty.right_delimiter') || '%}';

    //include 读取preprocessor的配置是为了向下兼容
    include = conf.include || fis.config.get('settings.preprocessor.widget-inline.include') || null;
    //exclude 读取preprocessor的配置是为了向下兼容
    exclude = conf.exclude || fis.config.get('settings.preprocessor.widget-inline.exclude') || null;

    config = conf;

    var content = embedded(content, file);

    embeddedUnlock(file);

    return content;
};



var map = fis.compile.lang;

function inline(id, properties) {
    id = id || '';
    properties = properties || '';
    var p, path = id;
    if ((p = id.indexOf(':')) !== -1) {
        var namespace = id.substr(0, p);
        if (namespace != fis.config.get('namespace')) {
            return false;
        }
        path = '/' + id.substr(p + 1);
    }

    return ld + 'widget_inline ' + properties + rd          /*start*/
        + map.embed.ld + path + map.embed.rd
        + ld + 'require name="' + id + '"' + rd
        + ld + '/widget_inline' + rd;                   /*end*/

}

function hit(id, include, exclude) {
    var toString = Object.prototype.toString;
    return !(exclude && toString.apply(exclude) == '[object RegExp]' && exclude.test(id)) && (include && toString.apply(include) == '[object RegExp]' && include.test(id));
}

function embedded(content, file) {
    var inline_re = /\s+inline(?:\s+|$)/i;
    var escape_ld = fis.util.escapeReg(ld);
    var escape_rd = fis.util.escapeReg(rd);
    var widget_re = new RegExp(escape_ld + 'widget(?:((?=\\s)[\\s\\S]*?["\'\\s\\w\\]`])'+escape_rd+'|'+escape_rd+')', 'ig');
    
    content = content.replace(widget_re, function(m, properties) {
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
                    res = inline(info.rest, properties.replace(inline_re, '').trim());
                } else if (hit(info.rest, include, exclude)) {
                    res = inline(info.rest, properties);
                }
                if (res) {
                    m = res;
                }
            }
        }

        return m;
    });

    return standard(content, file);
}

var embeddedMap = {};

function error(msg){
    //for watching, unable to exit
    embeddedMap = {};
    fis.log.error(msg);
}

function embeddedCheck(main, embedded){
    main = fis.file.wrap(main).realpath;
    embedded = fis.file.wrap(embedded).realpath;
    if(main === embedded){
        error('unable to embed file[' + main + '] into itself.');
    } else if(embeddedMap[embedded]) {
        var next = embeddedMap[embedded],
            msg = [embedded];
        while(next && next !== embedded){
            msg.push(next);
            next = embeddedMap[next];
        }
        msg.push(embedded);
        error('circular dependency on [' + msg.join('] -> [') + '].');
    }
    embeddedMap[embedded] = main;
    return true;
}

function embeddedUnlock(file){
    delete embeddedMap[file.realpath];
}


function addDeps(a, b){
    if(a && a.cache && b){
        if(b.cache){
            a.cache.mergeDeps(b.cache);
        }
        a.cache.addDeps(b.realpath || b);
    }
}

function standard(content, file) {
    var path = file.realpath;
    if(typeof content === 'string'){
        fis.log.debug('widget_inline start');
        //expand language ability
        content = content.replace(map.reg, function(all, type, value){
            var ret = '', info;
            try {
                switch(type){
                    case 'embed':
                        info = fis.uri(value, file.dirname);
                        var f;

                        if(info.file){
                            f = info.file;
                        } else if(fis.util.isAbsolute(info.rest)){
                            f = fis.file(info.rest);
                        }
                        if(f && f.isFile()){
                            if(embeddedCheck(file, f)){
                                var ret = exports(f.getContent(), f, config);
                                //@TODO use cache
                                //addDeps(file, f);
                            }
                        } else {
                            fis.log.error('unable to embed non-existent file [' + value + ']');
                        }
                        break;
                    default :
                        fis.log.error('unsupported fis language tag [' + type + ']');
                }
            } catch (e) {
                embeddedMap = {};
                e.message = e.message + ' in [' + file.subpath + ']';
                throw  e;
            }
            
            return ret;
        });

        fis.log.debug('widget_inline end');
    }
    return content;
}
