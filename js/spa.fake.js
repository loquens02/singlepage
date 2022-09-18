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

    let peopleList, makeFakeId, mockSio, getPeopleList
    let fakeIdSerial = 5
    makeFakeId = function () {
        return 'id_' + String(fakeIdSerial++) // 계속 5만 나온다.
    }


    /**
     * 가짜 사람 목록
     * @return {array}
     */
    peopleList = [
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

    getPeopleList = function () {
        return peopleList
    }

    mockSio = (function () {
        let on_sio, emit_sio, emit_mock_msg
        let send_listchange, listchange_idto
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
            let person_map
            // 3초 대기 후 'adduser' 이벤트에 'userupdate' 콜백으로 응답
            if (msg_type === 'adduser' && callback_map.userupdate) {
                // 사용자가 로그인할 때 발생하는 adduser 메시지 응답 내용
                setTimeout(function () {
                    person_map = {
                        id: makeFakeId(), // 이게 message_map 에서 sender_id 로 들어간다
                        name: data.name,
                        css_map: data.css_map
                    }
                    peopleList.push(person_map)
                    callback_map.userupdate([person_map])
                }, 1000) // 디버깅 편의를 위해 3초 -> 1초로 줄임
            }

            // 2초 대기 후 'updatechat' 이벤트에 'updatechat' 콜백으로 (mock)응답. 사용자 정보를 그대로 출력
            if (msg_type === 'updatechat' && callback_map.updatechat) {
                setTimeout(function () {
                    const user = spa.model.people.get_user()
                    callback_map.updatechat([{ // ?? 여태껏(22.8.13) updatecaht 오타로 되어 있었다. updatechat 로 수정
                        dest_id: user.id,
                        dest_name: user.name,
                        sender_id: data.sender_id,
                        msg_text: 'Thanks for the note, ' + user.name + '!'
                    }])
                }, 2000)
            }
            // leavechat 메시지를 받으면 chat 에서 사용하는 콜백을 제거. 이때는 사용자가 로그아웃한 상태
            if(msg_type === 'leavechat'){
                // 로그인 상태 재설정
                delete callback_map.listchange // ? 여기 선언된 게 없는데?
                delete callback_map.updatechat
                if(listchange_idto){
                    clearTimeout(listchange_idto)
                    listchange_idto= undefined
                }
                send_listchange()
            }
            /**
             * 로그인한 사용자에게 8초마다 mock 메시지 전송 시도
             * - 사용자가 로그인되어 있고 updatechat 콜백이 설정된 경우에만 성공한다
             * - 작업이 성공하면 이 루틴에서는 다시 자신을 호출하지 않으므로(실행 시 false 리턴하나봄) 추가로 mock 메시지를 전송하지 않는다.
             */
            emit_mock_msg = function () {
                setTimeout(function () {
                    const user = spa.model.people.get_user()
                    if(callback_map.updatechat){
                        callback_map.updatechat([{
                            dest_id: user.id,
                            dest_name: user.name,
                            sender_id: data.sender_id,
                            msg_text: 'Thanks for the note, ' + user.name + '!'
                        }])
                    }
                    else {
                        emit_mock_msg()
                    }
                }, 8000)
            }

        }

        /**
         * 백엔드로부터 listchange 메시지를 수신하는 기능을 에뮬레이션한다.
         * - listchange: 사용자가 로그인하고 채팅방에 참여한 후에만 chat 객체가 등록하는 콜백
         * @function listchange 콜백 사용을 매초 시도. 처음 성공하고 나면 시도 중단
         */
        send_listchange = function () {
            listchange_idto = setTimeout(function () {
                if (callback_map.listchange) {
                    callback_map.listchange([peopleList])
                    // 사용자가 로그인한 후 mock 메시지 전송 시도
                    emit_mock_msg()
                    listchange_idto = undefined
                } else {
                    send_listchange()
                }
            }, 1000)
        }

        // process start ..
        send_listchange()

        return {
            on: on_sio,
            emit: emit_sio
        }
    })()

    return {
        // 이제 listchange 핸들러에서 필요한 데이터를 제공하므로 제거? (p.241 -> 264)
        // ERROR p.239 spa.module.initModule 에서 쓰는데 없앤다? 그냥 냅둠
        getPeopleList: getPeopleList,
        mockSio: mockSio
    }
})()
