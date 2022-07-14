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
    const initModule = function ($container) {
        spa.shell.initModule($container)
    }
    return { initModule: initModule}
})()

// $container.html(
//     '<h1 style="display:inline-block; margin:25px;">'
//     + 'hello world!'
//     + '</h1>'
// )





