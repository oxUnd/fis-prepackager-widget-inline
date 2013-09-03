<?php

function smarty_compiler_widget_inline($arrParams,  $smarty) {
    $paramClassPath = preg_replace('/[\\/\\\\]+/', '/', dirname(__FILE__) . '/widget_inline/paramstack.class.php');
    $strCode = '<?php if(!class_exists(\'ParamStack\')){require_once(\'' . $paramClassPath . '\');}';
    $strCode .= 'ParamStack::push($_smarty_tpl->tpl_vars);';
    foreach ($arrParams as $_key => $_value) {
        $strCode .= '$_smarty_tpl->tpl_vars['.$_key.'] = new Smarty_Variable('.$_value.');';
    }
    $strCode .= '?>';
    return $strCode;
}

function smarty_compiler_widget_inlineclose($arrParams,  $smarty) {
    $paramClassPath = preg_replace('/[\\/\\\\]+/', '/', dirname(__FILE__) . '/widget_inline/paramstack.class.php');
    $strCode = '<?php if(!class_exists(\'ParamStack\')){require_once(\'' . $paramClassPath . '\');}';
    $strCode .= '$_smarty_tpl->tpl_vars = ParamStack::pop();';
    $strCode .= '?>';
    return $strCode;
}