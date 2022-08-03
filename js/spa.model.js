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
    }
    let isFakeData = true // true: 모델에서 가짜 데이터를 사용한다
    let makePerson, personProto, removePerson
    let people, clearPeopleDB, makeCid, completeLogin
    let initModule


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
        }

        // 백엔드에서 user update 메시지를 발송할 때, 로그인을 마칠 수 있게 콜백 등록
        sio.on('user update', completeLogin)

        // 사용자 상세 정보와 함께 adduser 메시지를 백엔드로 전송. 사용자 추가 행동은 로그인 행동과 같은 행동이다(?)
        sio.emit('adduser', {
          cid: stateMap.user.cid,
          css_map: stateMap.user.css_map,
            name: stateMap.user.name
        })

        /**
         * @event spa-logout 로그아웃 절차가 완료될 때 발행된다. 이때 이전 사용자 객체가 데이터로 제공된다.
         * @return {*}
         * @function people 클로저에 logout 메서드 정의
         */
        logout= function () {
            const user= stateMap.user
            // 채팅 기능을 추가할 때 여기서 채팅방을 떠나야 한다
            const is_removed= removePerson(user)

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

    initModule = function () {
        let i, people_list, person_map
        // 익명 사용자 초기화
        stateMap.anonymous_user = makePerson({
            cid: configMap.anonymous_id,
            id: configMap.anonymous_id,
            name: 'anonymous',
        })
        stateMap.user = stateMap.anonymous_user

        if(isFakeData){
            people_list= spa.fake.getPeopleList()
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
        people: people,
    }
})()