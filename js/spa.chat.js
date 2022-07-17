/*
spa.chat.js
SPA 용 채팅 기능 모듈
 */
/*jslint            browser: true,      continue: true,
devel: true,        indent: 2,          maxerr:     50,
newcap: true,       nomen: true,        plusplus: true,
regexp: true,       sloppy: true,       vars:     false,
white:  true
 */
/*global $, spa */
spa.chat = (function () {
    // --- 모듈 스코프 변수 ---
    const configMap = {
        main_html: String()
            + '<div class="padding:1em; color:#fff;">'
            + '  say hello to chat'
            + '</div>',
        settable_map: {}
    }
    let stateMap = {$container: null}
    let jqueryMap = {}
    let setJqueryMap, configModule, initModule
    // --- /모듈 스코프 변수---

    // --- 유틸리티 메서드 ---
    // --- /유틸리티 메서드 ---

    // --- DOM 메서드 ---
    setJqueryMap = function () {
        let $container = stateMap.$container
        jqueryMap = {$container: $container}
    }
    // --- /DOM 메서드 ---

    // --- public 메서드 ---
    /**
     * 허용된 키의 설정 조정
     * @param input_map 설정 가능한 키와 값으로 구성된 맵. color_name: 사용할 색상
     * @return {Boolean} true
     */
    configModule = function (input_map) {
        spa.util.setConfigMap({
            input_map: input_map,
            settable_map: configMap.settable_map,
            config_map: configMap
        })
        return true
    }

    /**
     * 채팅 모듈을 초기화한다.
     * @param $container $container 기능에서 사용하는 컨테이너
     * @return {boolean}
     * @function initModule 모든 실행을 시작한다. 거의 모든 모듈에 들어있는 것
     */
    initModule = function ($container) {
        $container.html(configMap.main_html) // 채팅 슬라이더 컨테이너를 HTML 템플릿으로 채우기
        stateMap.$container = $container
        setJqueryMap()
        return true
    }

    return { // 모듈 메서드를 외부로 노출한다. configModule, initModule 은 거의 모든 모듈에서 사용하는 표준 메서드
        configModule: configModule,
        initModule: initModule
    }
    // --- /public 메서드 ---
})()