/**
 * fis.baidu.com
 * DESC:
 * {%widget name="demo:a.tpl" inline%}
 *  =>
 * {%widget_inline%}<!--inline [/a.tpl]-->{%/widget_inline%}
 */


'use strict';

var ld
    , rd
    , include
    , exclude
    , ids
    , parsed;

var exports = module.exports = function(ret, conf, settings, opt) {
    
    ld = settings.left_delimiter || fis.config.get('settings.smarty.left_delimiter') || '{%';
    rd = settings.right_delimiter || fis.config.get('settings.smarty.right_delimiter') || '%}';
    
    //include 读取preprocessor的配置是为了向下兼容
    include = settings.include || fis.config.get('settings.preprocessor.widget-inline.include') || null;
    //exclude 读取preprocessor的配置是为了向下兼容
    exclude = settings.exclude || fis.config.get('settings.preprocessor.widget-inline.exclude') || null;
    
    ids = ret.ids || {};
    parsed = {};
    fis.util.map(ids, function (src, file) {
        if (file.rExt == '.tpl') {

            var revertObj = {};
            //@TODO, ugly!!!
            //prepackager 缓存一定是存在的
            if(file.cache.revert(revertObj)) {
                file.requires = revertObj.info.requires;
                file.extras = revertObj.info.extras;
                //存储缓存时获取原缓存附加信息，以防止升级出现兼容问题
                revertObj = revertObj.info;
            }

            embedded(file);

            file.cache.save(file.getContent(), revertObj);
        }
    });

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
    }

    return ld + 'widget_inline ' + properties + rd          /*start*/
        + map.embed.ld + id + map.embed.rd
        + ld + 'require name="' + id + '"' + rd
        + ld + '/widget_inline' + rd;                   /*end*/

}

function hit(id, include, exclude) {
    var toString = Object.prototype.toString;
    return !(exclude && toString.apply(exclude) == '[object RegExp]' && exclude.test(id)) && (include && toString.apply(include) == '[object RegExp]' && include.test(id));
}

function preparser(file) {
    var inline_re = /\s+inline(?:\s+|$)/i;
    var escape_ld = fis.util.escapeReg(ld);
    var escape_rd = fis.util.escapeReg(rd);
    var widget_re = new RegExp(escape_ld + 'widget(?:((?=\\s)[\\s\\S]*?["\'\\s\\w\\]`])'+escape_rd+'|'+escape_rd+')', 'ig');
    var content = file.getContent();
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

    return content;
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

function embedded(file) {
    if (parsed[file.realpath]) {
        return true;
    } else {
        var path = file.realpath;
        var content = preparser(file);
        if(typeof content === 'string'){
            fis.log.debug('widget_inline start');
            //expand language ability
            content = content.replace(map.reg, function(all, type, value){
                var ret = '', info;
                try {
                    switch(type){
                        case 'embed':
                            var f = ids[value];
                            if(f && f.isFile()){
                                if(embeddedCheck(file, f)){
                                    embedded(f);
                                    addDeps(file, f); //添加依赖
                                    embeddedUnlock(f);
                                    ret = f.getContent();
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
        file.setContent(content);
        parsed[file.realpath] = true;
        return true;
    }
}
