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
spa.fake = (function () {
    'use strict';
    // https://www.w3schools.com/js/js_strict.asp ECMA5 추가 사항. 변수나 함수 삭제 불가, 변수 키워드 없이 사용 불가 등
    // 스크립트나 함수의 '시작 부분에서만' 인식한다. IE 10+. 9 이하에서는 문자열로만 인식하므로 무시

    let getPeopleList, makeFakeId, makeFakeCid, mockSio
    let fakeIdSerial = 5
    makeFakeId = function () {
        return 'id_' + String(fakeIdSerial)
    }
    makeFakeCid = function () {
        return String(fakeIdSerial)
    }


    /**
     * 가짜 사람 목록
     * @return {array}
     */
    getPeopleList = function () {
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

    mockSio = (function () {
        let on_sio, emit_sio
        let callback_map = {}

        /**
         * 특정 메시지 타입에 대한 콜백을 등록한다
         * @example on_sio('updateuser', onUpdateuser); onUpdateuser 함수를 updateuser 메시지 타입에 대한 콜백으로 등록
         * @param msg_type
         * @param callback 등록한 콜백은 메시지 타입을 인자로 받는다
         */
        on_sio = function (msg_type, callback) {
            callback_map[msg_type] = callback
        }

        /**
         * 서버로의 메시지 전솔을 에뮬레이션한다. 일단 adduser 메시지 타입만 검사한다
         * @param msg_type
         * @param data
         * @function 메시지를 받으면 네트워크 반응 지연 시간을 시뮬레이션하기 위해 3초를 기다린 후 updateuser 콜백을 호출한다
         */
        emit_sio = function (msg_type, data) {
            if (msg_type === 'adduser' && callback_map.userupdate) {
                setTimeout(function () {
                    callback_map.userupdate(
                        [{
                            cid: makeFakeCid(),
                            id: makeFakeId(),
                            name: data.name,
                            css_map: data.css_map
                        }]
                    )
                    fakeIdSerial++
                }, 3000)
            }
        }

        return {
            on: on_sio,
            emit: emit_sio
        }
    })()

    return {
        getPeopleList: getPeopleList,
        mockSio: mockSio
    }
})()
