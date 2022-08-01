/*
spa.util_b.js
자바스크립트 브라우저 유틸리티
 */
/*jslint         browser : true, continue : true,
    devel  : true, indent  : 2,    maxerr   : 50,
    newcap : true, nomen   : true, plusplus : true,
    regexp : true, sloppy  : true, vars     : false,
    white  : true
 */
/*global $, spa, getComputedStyle */
spa.util_b = (function () {
    'use strict' // strict mode pragma

    // --- 모듈 스코프 변수 ---
    const configMap = {
        regex_encode_html: /[&"'><]/g,
        regex_encode_noamp: /["'><]/g,
        html_encode_map: {
            '&': '&#38;',
            '"': '&#34;',
            "'": '&#39;',
            '>': '&#62;',
            '<': '&#60;'
        }
    }
    let decodeHtml, encodeHtml, getEmSize

    // 엔티티 인코딩 용. 설정의 수정 복사본
    configMap.encode_noamp_map = $.extend(
        {}, configMap.html_encode_map
    )
    delete configMap.encode_noamp_map['&'] // '&' 제거
    // --- /모듈 스코프 변수 ---

    // --- 유틸리티 메서드 ---
    /*
     * HTML 엔티티를 브라우저 친화적으로 디코딩한다
     * @example &amp; 와 같은 엔티티를 & 과 같은 표시 문자로 변환
     * @see XSS 취약점 https://stackoverflow.com/a/1912546
     * - 개발자의 코드 외에 사용자 입력에 쓸 경우 .ex) <script> 코드를 실행시킨다
     * @param str
     * @return {*|jQuery}
    decodeHtml = function(str) {
        return $('<div/>').html(str || '').text()
    }
    */
    /**
     * Unescape HTML entities without XSS weakness
     * @example &amp; 와 같은 엔티티를 & 과 같은 표시 문자로 변환
     * @example  htmlDecode("&lt;img src='myimage.jpg'&gt;")
     * @see https://stackoverflow.com/a/34064434
     * @supported IE 9+, the others https://caniuse.com/?search=domparser
     * @param str
     * @return {*|jQuery}
     * @function 유틸리티 메서드
     * TODO 에러나면 이거 주석 치고 책에 있던 위에 코드로 바꾸기
     */
    decodeHtml = function (str) {
        const doc = new DOMParser().parseFromString(str, "text/html")
        return doc.documentElement.textContent
    }

    /**
     * & 과 같은 특수 문자를 &amp; 와 같은 HTML 인코딩 값으로 변환
     * @param input_arg_str
     * @param exclude_amp
     * @return {string}
     * @function 유틸리티 메서드- 모든 HTML 엔티티는 이 인코더를 통과한다. 이 인코더는 임의 개수의 문자를 처리한다
     */
    encodeHtml = function (input_arg_str, exclude_amp) {
        const input_str = String(input_arg_str)
        let regex, lookup_map

        if (exclude_amp) {
            lookup_map = configMap.encode_noamp_map
            regex = configMap.regex_encode_noamp
        } else {
            lookup_map = configMap.html_encode_map
            regex = configMap.regex_encode_html
        }

        return input_str.replace(regex,
            function (match, name) {
                return lookup_map[match] || ''
            }
        )
    }

    /**
     * em 표시 단위를 px로 변환. jQuery 의 크기 단위를 사용할 수 있도록
     * @example spa.util_b.getEmSize(jqueryMap.$slider.get(0)) >> spa.chat.js
     * @param elem em
     * @return {number} px
     * @function 유틸리티 메서드
     */
    getEmSize = function (elem) {
        return Number(
            getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]
        )
    }
    // --- /유틸리티 메서드 ---

    return {
        decodeHtml: decodeHtml,
        encodeHtml: encodeHtml,
        getEmSize: getEmSize
    }
})
()