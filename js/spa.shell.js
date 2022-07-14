/*
spa.shell.js
SPA 용 셀 모듈
 */
/*jslint            browser: true,      continue: true,
devel: true,        indent: 2,          maxerr:     50,
newcap: true,       nomen: true,        plusplus: true,
regexp: true,       sloppy: true,       vars:     false,
white:  true
 */
/*global $, spa */
spa.shell = (function () {
    // --- 모듈 스코프 변수 시작 ---
    const configMap = { // 정적 설정값
        main_html : String()
            + '<div class="spa-shell-head">'
            + '  <div class="spa-shell-head-logo"></div>'
            + '  <div class="spa-shell-head-acct"></div>'
            + '  <div class="spa-shell-head-search"></div>'
            + '</div>'
            + '<div class="spa-shell-main">'
            + '  <div class="spa-shell-main-nav"></div>'
            + '  <div class="spa-shell-main-content"></div>'
            + '</div>'
            + '<div class="spa-shell-foot"></div>'
            + '<div class="spa-shell-chat"></div>'
            + '<div class="spa-shell-modal"></div>'
    }
    const stateMap = { $container : null } // 모듈 사이에 공유하는 동적 정보
    let jqueryMap = {} // jQuery 컬렉션 객체 캐싱
    let setJqueryMap, initModule
    // --- 모듈 스코프 변수 끝 ---

    // --- 유틸리티 메서드 시작 ---
    // 페이지 엘리먼트와 상호작용하지 않는 함수
    // --- 유틸리티 메서드 끝 ---

    // --- DOM 메서드 시작 ---
    // 페이지 엘리먼트를 생성하고 조작하는 함수
    // DOM 메서드 /setJqueryMap/ 시작
    setJqueryMap = function () { // jQuery 컬렉션 객체 캐싱 > jQuery 문서 탐색 횟수 줄이기
        const $container = stateMap.$container
        jqueryMap = { $container : $container }
    }
    // DOM 메서드 /setJqueryMap/ 끝
    // --- DOM 메서드 끝 ---

    // --- 이벤트 핸들러 시작 ---
    // --- 이벤트 핸들러 끝 ---

    // --- public 메서드(외부 노출) 시작 ---
    // public 메서드 /initModule/ 시작
    initModule = function ($container) {
        stateMap.$container = $container
        $container.html(configMap.main_html)
        setJqueryMap()
    }
    // public 메서드 /initModule/ 끝

    return { initModule : initModule }
    // 모듈 내보내기. 공개 메서드를 맴에 집어넣어 반환 > 외부에 명시적으로 노출
    // --- public 메서드 끝 ---
})()