/*
spa.fake.js
아바타 기능 모듈
 */
/*jslint         browser : true, continue : true,
    devel  : true, indent  : 2,    maxerr   : 50,
    newcap : true, nomen   : true, plusplus : true,
    regexp : true, sloppy  : true, vars     : false,
    white  : true
 */
/*global $, spa */
spa.fake= (function(){
    'use strict';
    // https://www.w3schools.com/js/js_strict.asp ECMA5 추가 사항. 변수나 함수 삭제 불가, 변수 키워드 없이 사용 불가 등
    // 스크립트나 함수의 '시작 부분에서만' 인식한다. IE 10+. 9 이하에서는 문자열로만 인식하므로 무시

    /**
     * 가짜 사람 목록
     * @return {array}
     */
    const getPeopleList = function(){
        return [
            {
                cid: '1',
                name: 'Betty',
                id: 'id_01',
                css_map: {top: 20, left: 20, 'background-color': 'rgb(128, 128, 128)'}
            },
            {
                cid: '2',
                name: 'Mike',
                id: 'id_02',
                css_map: {top: 60, left: 20, 'background-color': 'rgb(128, 255, 128)'}
            },
            {
                cid: '3',
                name: 'Pebbles',
                id: 'id_03',
                css_map: {top: 100, left: 20, 'background-color': 'rgb(128, 192, 192)'}
            },
            {
                cid: '4',
                name: 'Wilma',
                id: 'id_04',
                css_map: {top: 140, left: 20, 'background-color': 'rgb(192, 128, 128)'}
            }
        ]
    }
    return {getPeopleList:getPeopleList}
})()
