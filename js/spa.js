/*
* spa.js
* 루트 네임스페이스 모듈
* */

/*jslint            browser: true,      continue: true,
devel: true,        indent: 2,          maxerr:     50,
newcap: true,       nomen: true,        plusplus: true,
regexp: true,       sloppy: true,       vars:     false,
white:  true
 */

/*global $, spa */
const spa = (function () {
    'use strict';
    const initModule = function ($container) {
        spa.model.initModule() // 순서1. 모델을 셸보다 먼저 초기화
        spa.shell.initModule($container) // 순서2

        spa.model.test.logInOutTest() // TODO release 전에 꼭 주석하기
    }
    return { initModule: initModule}
})()

// $container.html(
//     '<h1 style="display:inline-block; margin:25px;">'
//     + 'hello world!'
//     + '</h1>'
// )





