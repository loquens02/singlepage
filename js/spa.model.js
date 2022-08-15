/*
spa.model.js
모델 모듈
 */
/*jslint            browser: true,      continue: true,
devel: true,        indent: 2,          maxerr:     50,
newcap: true,       nomen: true,        plusplus: true,
regexp: true,       sloppy: true,       vars:     false,
white:  true
 */
/*global $, spa */
/**
 * people 객체 컬렉션 관리를 위한 메서드 및 이벤트 제공
 * @method get_user 현재 사용자 객체 반환. 현재 사용자가 로그인 상태가 아니면 익명 사람 객체 반환
 * @method login(<user_name>) 인자로 받은 사용자명을 사용해 사용자 로그인. 이때 새 신원을 반영하기 위해 현재 사용자 객체가 변경된다
 * @method logout() 사용자 로그아웃. 현재 사용자 객체의 신원을 익명으로 되돌린다
 */
spa.model = (function () {
    'use strict';
    const configMap = {anonymous_id: 'a0'}
    let stateMap = {
        anonymous_user: null,
        cid_serial: 0,
        people_cid_map: {}, // 클라이언트 ID를 key 로 하는 '찾은 사람 객체 맵'
        people_db: TAFFY(), // insert 나 join 기능이 있는 DB 컬렉션. 사람 객체의 TaffyDB 컬렉션. 빈 컬렉션으로 초기화
        user: null, // 현재 사용자 객체
        is_connected: false, // 사용자가 현재 채팅방에 있는지 알려주는 flag
    }
    let isFakeData = true // true: 모델에서 가짜 데이터를 사용한다
    let makePerson, personProto, removePerson
    let people, clearPeopleDB, makeCid, completeLogin
    let initModule
    let chat


    /**
     * 프로토타입 사용. 메모리 사용량 감소 및 객체 성능 개선 목적.
     * @type {{get_is_user: (function(): boolean), get_is_anonymous: (function(): boolean)}}
     * @method get_is_user 객체가 현재 사용자면 true 반환
     * @method get_is_anonymous 객체가 익명 사용자면 true 반환
     */
    personProto = {
        get_is_user: function () {
            return this.cid === stateMap.user.cid
        },
        get_is_anonymous: function () {
            return this.cid === stateMap.anonymous_user.cid
        }
    }

    makeCid = function () {
        return 'c' + String(stateMap.cid_serial++)
    }

    /**
     * 익명 Person 과 사용자가 로그인한 경우, 현재 사용자를 제외한 모든 Person 객체를 제거
     * - 일단 비우고 user 가 있으면 그것만 넣는다
     */
    clearPeopleDB = function () {
        const user= stateMap.user
        stateMap.people_db = TAFFY()
        stateMap.people_cid_map = {}
        if (user) {
            stateMap.people_db.insert(user)
            stateMap.people_cid_map[user.cid] = user
        }
    }

    /**
     * @event spa-login 사용자 로그인 절차가 완료될 때 발행된다. 이때 업데이트된 사용자 객체가 데이터로 제공된다
     * @param user_list
     */
    completeLogin = function (user_list) {
        const user_map = user_list[0]
        delete stateMap.people_cid_map[user_map.cid]

        stateMap.user.cid = user_map.cid
        stateMap.user.id = user_map.id
        stateMap.user.css_map = user_map.css_map
        stateMap.people_cid_map[stateMap.user.cid] = stateMap.user
        // 로그인하면 바로 채팅방에 참여하도록한다
        chat.join()
        // 채팅 기능을 추가할 때, 여기서 채팅에 참여하게 해야 한다
        $.gevent.publish('spa-login', [stateMap.user])
    }

    /**
     * Person 객체를 생성하여 TaffyDB 컬렉션에 저장. people_cid_map 내의 인덱스도 업데이트 한다.
     * @param person_map
     * @return {*}
     * @instance Person {cid, id, name, css_map}
     *
     * - cid: 문자열 클라이언트 id(필수)
     * - id: 고유 id
     * - name: 사용자 문자열 이름
     * - css_map: 아바타 표현 용 속성 맵
     */
    makePerson = function (person_map) {
        let person
        const cid= person_map.cid
        const css_map= person_map.css_map
        const id= person_map.id
        const name= person_map.name

        if (cid === undefined || !name) {
            throw 'client id and name are required'
        }

        person = Object.create(personProto)
        person.cid = cid
        person.name = name
        person.css_map = css_map
        if(id){
            person.id = id
        }
        stateMap.people_cid_map[cid] = person
        stateMap.people_db.insert(person)

        return person
    }

    /**
     * 사람 목록에서 Person 객체를 제거한다
     * - 논리적 비일관성(현재 사용자나 익명 Person 객체는 제거 대상이 아니다)을 방지
     * @param person
     * @return {boolean}
     */
    removePerson = function (person) {
        if (!person) {
            return false
        }
        // 익명 사용자는 제거할 수 없다
        if(person.id === configMap.anonymous_id){
            return false
        }

        stateMap.people_db({cid: person.cid}).remove()
        if(person.cid){
            delete stateMap.people_cid_map[person.cid]
        }
        return true
    }

    /**
     * @type {{get_cid_map: (function(): {}), get_db: (function(): *)}}
     * @method get_db 미리 정렬된 모든 사람 객체(현재 사용자 포함)가 있는 TaffyDB 데이터베이스 반환
     * @method get_by_cid(<client_id>) 인자로 전달받은 고유 id 에 해당하는 사람 객체를 반환
     * @function people 클로저 정의. 이 클로저를 통해 원하는 메서드만 외부로 공개한다.
     */
    people = (function () {
        let get_by_cid, get_db, get_user, login, logout
        get_by_cid = function (cid) {
            return stateMap.people_cid_map[cid]
        }
        get_db= function () {
            return stateMap.people_db
        }
        get_user= function () {
            return stateMap.user
        }
        /**
         * 제한: 여기서는 사용자 인증 정보 검사를 하지 않는다
         * @param name
         * @function people 클로저에 logout 메서드 정의
         */
        login= function (name) {
            const sio= isFakeData? spa.fake.mockSio : spa.data.getSio()

            stateMap.user= makePerson({
                cid: makeCid(),
                css_map: {top: 25, left: 25, 'background-color': '#8f8'},
                name: name
            })

            // 백엔드에서 userupdate 메시지를 발송할 때, 로그인을 마칠 수 있게 콜백 등록
            // Solution: 띄어쓰기를 하면 안 된다. 주석에 user update + 무지성 copilot
            sio.on('userupdate', completeLogin);

            // 사용자 상세 정보와 함께 adduser 메시지를 백엔드로 전송. 사용자 추가 행동은 로그인 행동과 같은 행동이다(?)
            sio.emit('adduser', {
                cid: stateMap.user.cid,
                css_map: stateMap.user.css_map,
                name: stateMap.user.name
            })
        }



        /**
         * @event spa-logout 로그아웃 절차가 완료될 때 발행된다. 이때 이전 사용자 객체가 데이터로 제공된다.
         * @return {*}
         * @function people 클로저에 logout 메서드 정의
         */
        logout= function () {
            let is_removed
            const user= stateMap.user
            // 로그아웃이 완료되면 자동으로 채팅방에서 나가지게끔 한다
            chat.leave()
            // 채팅 기능을 추가할 때 여기서 채팅방을 떠나야 한다
            is_removed= removePerson(user)

            stateMap.user= stateMap.anonymous_user
            $.gevent.publish('spa-logout', [user])

            return is_removed
        }

        return {
            get_by_cid: get_by_cid,
            get_db: get_db,
            get_user: get_user,
            login: login,
            logout: logout
        }
    })()

    /**
     * chat 은 채팅 메시지를 관리하는 객체이다.
     * - chatee [스페인] 수다쟁이. 여기서는 채팅 상대를 의미
     * @example spa.model.chat 에서 사용할 수 있다
     * @method join() : 채팅방에 참가한다. 사용자가 익명이면 아무 일도 하지 않고 바로 false 반환
     * @method get_chatee() : 채팅 중인 사용자의 Person 객체 반환. 채팅 상대가 없다면 null 반환
     * @method set_chatee(<person_id>) : 채팅 상대를 person_id 를 통해 고유 식별한 사람(person 객체)으로 설정한다.
     * person_id 가 사람 목록(온라인 상태인 사람 컬렉션)에 존재하지 않으면 채팅 상대(chatee)는 null 로 설정한다
     * 요청한 사람이 이미 채팅 중인 사람이라면 false 를 반환한다
     * 채팅 상대 정보를 데이터로 제공하는 spa-setchatee 전역 커스텀 이벤트를 발송한다
     * @method send_message(<msg_text>) : 채팅 상대에게 메시지를 보낸다
     * 이때 메시지 정보를 데이터로 사용해 spa-updatechat 전역 커스텀 이벤트를 발송한다
     * 사용자가 익명이거나 채팅 상대가 null 이면 이 메서드는 작업을 중단하고 false 를 반환한다
     * @method update_avatar(<update_avatar_map>) :person 객체에 대한 아바타 정보를 수정한다
     * 인자(update_avatar_map)에는 person_id와 css_map 속성이 있어야 한다
     *
     * @event spa-listchange : 온라인 상태인 사람 목록이 바뀔 때 발송한다
     * 업데이트된 사람 컬렉션 데이터 제공
     * @event spa-setchatee : 채팅 상대가 바뀔 때 발송한다. 새 채팅 상대 설정
     * 기존 채팅 상대와 새로운 채팅 상대의 맵 데이터 제공
     * {
     *     old_chatee: <old_chatee_person_object>,
     *     new_chatee: <new_chatee_person_object>
     * }
     * @event spa-updatechat : 새 메시지를 보내거나 받을 때 발송한다
     * 메시지 정보 맵 데이터 제공
     * {
     *     dest_id: <chatee_id>,
     *     dest_name: <chatee_name>,
     *     sender_id: <sender_id>,
     *     msg_text: <message_content>
     * }
     *
     * @see p.260
     */
    chat = (function () {
        let publish_listChange, publish_updatechat, update_list, leave_chat, join_chat
        let get_chatee, set_chatee, send_message
        let chatee = null

        /**
         * 새 사람들 목록을 전달 받으면 사람들 객체를 갱신
         * @param arg_list
         */
        update_list = function (arg_list) {
            let i, person_map, make_person_map
            const people_list= arg_list[0]
            let is_chatee_online = false

            clearPeopleDB()
            PERSON:
            for (i= 0; i < people_list.length; i++) {
                person_map= people_list[i]
                if (!person_map.name) {
                    continue PERSON
                }
                // 사용자가 정의되어 있으면 css_map 업데이트하고 나머지를 건너뜀
                if (!make_person_map) {
                    stateMap.user.css_map = person_map.css_map
                    continue PERSON
                }
                make_person_map = {
                    cid: person_map.cid,
                    css_map: person_map.css_map,
                    id: person_map.id,
                    name: person_map.name
                }

                // Person 객체(채팅 상대)가 null 이 아니고, 채팅 상대를 업데이트된 사용자 목록에서 찾은 경우 is_chatee_online 설정
                if(chatee && chatee.id === make_person_map.id) {
                    is_chatee_online = true
                }
                makePerson(make_person_map)
            }
            stateMap.people_db.sort('name')
            // Person 객체가 null 이 아니고, 채팅 상대가 오프라인 상태이면 채팅 상대 설정을 해제한다 > 'spa-setchatee' 전역 이벤트 발생
            if(chatee && !is_chatee_online) {
                set_chatee('')
            }
        }
        /**
         * 백엔드로부터 listchange 메시지를 받을 때마다 사용한다
         * @param arg_list
         * @function 업데이트된 사람들 목록 데이터와 함께 spa-listchange 전역 jQuery 이벤트를 발송
         */
        publish_listChange = function (arg_list) {
            update_list(arg_list)
            $.gevent.publish('spa-listchange', [arg_list])
        }
        /**
         * 
         * @function 메시지 상세 정보 데이터를 담아 spa-updatechat 이벤트 발송
         * @see p.270
         */
        publish_updatechat = function (arg_list) {
            const msg_map = arg_list[0]
            if(!chatee){
                set_chatee(msg_map.sender_id)
            }
            else if(msg_map.sender_id !== stateMap.user.id && msg_map.sender_id !== chatee.id) {
                set_chatee(msg_map.sender_id)
            }
            $.gevent.publish('spa-updatechat', [msg_map])
        }

        /**
         * 채팅방 떠나기
         * @function leavechat 메시지를 백엔드로 보내고 상태 변수를 정리한다
         */
        leave_chat = function () {
            const sio= isFakeData ? spa.fake.mockSio : spa.data.getSio()
            chatee= null
            stateMap.is_connected = false
            if (sio) {
                sio.emit('leavechat')
            }
        }
        /**
         * 채팅 상대 Person 객체 반환
         * @return {null}
         */
        get_chatee = function () {
            return chatee
        }
        /**
         * 채팅방 참여
         * @function listchange 콜백이 두 번 이상 등록되지 않도록, 사용자가 채팅에 이미 참여했는지 검사한다
         * @event listchange
         * @event updatechat
         */
        join_chat = function () {
            let sio
            if(stateMap.is_connected) {
                return false
            }
            if(stateMap.user.get_is_anonymous()){
                console.warn('User must be defined before joining chat')
                return false
            }

            sio = isFakeData ? spa.fake.mockSio : spa.data.getSio()
            sio.on('listchange', publish_listChange)
            // 백엔드로부터 수신한 updatechat 메시지를 처리하기 위해 'publish_updatechat' 바인딩
            // 이 메시지를 받을 때마다 spa-updatechat 이벤트가 발송된다(발생시킨다)
            sio.on('updatechat', publish_updatechat)
            stateMap.is_connected = true
            return true
        }
        /**
         * 텍스트 메시지 및 관련 상세 정보 전송
         */
        send_message = function (message_text) {
            let message_map
            const sio= isFakeData ? spa.fake.mockSio : spa.data.getSio()
            // 커넥션이 없는 경우 메시지 전송 중단.
            if(!sio) {
                return false
            }
            // 사용자나 채팅 상대가 설정되어 있지 않은 경우에도 메시지 전송 중단
            if(!(stateMap.user && chatee)) {
                return false
            }

            message_map = {
                dest_id: chatee.id,
                dest_name: chatee.name,
                sender_id: stateMap.user.id,
                message_text: message_text
            }

            // 채팅창에서 사용자가 (진행 중인) 메시지를 볼 수 있게 updatechat 발행 > spa-updatechat 이벤트 발송
            publish_updatechat([message_map])
            sio.emit('updatechat', message_map)
            return true
        }
        /**
         * 채팅 상대 객체를 인자로 받은 Person 객체로 변경
         * @param person_id
         * @return {boolean} 인자로 받은 Person 객체(채팅 상대)가 현재 채팅 상대와 같다면 false 반환
         */
        set_chatee = function (person_id) {
            let new_chatee= stateMap.people_cid_map[person_id]
            if(new_chatee){
               if(chatee && chatee.id === new_chatee.id){
                   return false
               }
            }
            else {
                new_chatee= null
            }
            // 기존 채팅 상대 및 새 채팅 상대 맵을 데이터로 담아 spa-setchatee 이벤트 발송
            $.gevent.publish('spa-setchatee', {old_chatee:chatee, new_chatee:new_chatee})
            chatee = new_chatee
            return true
        }

        return {
            leave: leave_chat,
            get_chatee: get_chatee,
            join: join_chat,
            send_message: send_message,
            set_chatee: set_chatee
        }
    })()

    initModule = function () {
        let i, people_list, person_map
        // 익명 사용자 초기화
        stateMap.anonymous_user = makePerson({
            cid: configMap.anonymous_id,
            id: configMap.anonymous_id,
            name: 'anonymous',
        })
        stateMap.user = stateMap.anonymous_user

        // p.239
        if(isFakeData){
            people_list= spa.fake.getPeopleList() // 이거 괜찮은지? 예나 지금이나 상수 넣는 것은 같다
            for(i=0; i<people_list.length; i++){
                person_map = people_list[i]
                makePerson({
                    cid: person_map.cid,
                    name: person_map.name,
                    id: person_map.id,
                    css_map: person_map.css_map,
                })
            }
        }
    }


    return {
        initModule: initModule,
        chat: chat,
        people: people
    }
})()