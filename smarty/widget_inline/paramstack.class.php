<?php

class ParamStack {
    static public $arrParams = array();
    static protected $first = null;
    static public function push($item) {
        if (empty(self::$arrParams)) {
            self::$first = $item;
        }
        array_push(self::$arrParams, $item);
    }
    static public function pop() {
        if (count(self::$arrParams) > 0) { 
            return array_pop(self::$arrParams);
        }
        //如果发现栈push, pop不对称，还原为最原始数据
        if (self::$first) {
            return self::$first;
        }
        return array();
    }
}