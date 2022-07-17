/*
spa.util.js
범용 자바스크립트 유틸리티
 */
/*jslint            browser: true,      continue: true,
devel: true,        indent: 2,          maxerr:     50,
newcap: true,       nomen: true,        plusplus: true,
regexp: true,       sloppy: true,       vars:     false,
white:  true
 */
/*global $, spa */
spa.util = (function () {
    let makeError, setConfigMap

    /**
     * 에러 객체 생성을 위한 편의 래퍼
     * @param name_text 에러 이름
     * @param msg_text 상세 에러 메시지
     * @param data 선택적으로 여러 객체에 첨부할 데이터
     * @return {Error} 새로 생성한 에러 객체
     * @function public 생성자
     */
    makeError= function (name_text, msg_text, data) {
        let error = new Error()
        error.name = name_text
        error.message = msg_text
        if(data){
            error.data = data
        }
        return error
    }

    /**
     * 기능 모듈에서 설정을 지정하기 위한 공통 코드
     * @param arg_map {input_map, settable_map, config_map}
     * - input_map: 설정에서 지정할 키-값 맵
     * - setting_map: 설정 가능한 키 맵
     * - config_map: 설정을 적용할 맵
     * @function public 메서드
     */
    setConfigMap = function (arg_map) {
        const input_map= arg_map.input_map
        const settable_map= arg_map.settable_map
        let config_map= arg_map.config_map
        let key_name, error

        for(key_name in input_map){
            if(input_map.hasOwnProperty(key_name)){
                if(settable_map.hasOwnProperty(key_name)){
                    config_map[key_name]= input_map[key_name]
                }
                else{
                    error= makeError('Bad Input',
                        'Setting config key |'+key_name+'| is not supported')
                    throw error
                }
            }
        }
        // return true //책 코드에는 없지만 주석에는 있다
    }

    return {
        makeError: makeError,
        setConfigMap: setConfigMap
    }
})()