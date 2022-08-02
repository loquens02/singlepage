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
 * @method get_db 미리 정렬된 모든 사람 객체(현재 사용자 포함)가 있는 TaffyDB 데이터베이스 반환
 * @method get_by_cid(<client_id>) 인자로 전달받은 고유 id 에 해당하는 사람 객체를 반환
 * @method login(<user_name>) 인자로 받은 사용자명을 사용해 사용자 로그인. 이때 새 신원을 반영하기 위해 현재 사용자 객체가 변경된다
 * @method logout() 사용자 로그아웃. 현재 사용자 객체의 신원을 익명으로 되돌린다
 * @event spa-login 사용자 로그인 절차가 완료될 때 발행된다. 이때 업데이트된 사용자 객체가 데이터로 제공된다
 * @event spa-logout 로그아웃 절차가 완료될 때 발행된다. 이때 이전 사용자 객체가 데이터로 제공된다.
 * @instance Person {cid, id, name, css_map} 문자열 클라이언트 id(필수), 고유 id, 사용자 문자열 이름, 아바타 표현 용 속성 맵
 */
spa.model = (function () {
    'use strict';
    const configMap = {anonymous_id: 'a0'}
    let stateMap = {
        anonymous_user: null,
        people_cid_map: {}, // 클라이언트 ID를 key 로 하는 '찾은 사람 객체 맵'
        people_db: TAFFY(), // 사람 객체의 TaffyDB 컬렉션. 빈 컬렉션으로 초기화
    }
    let isFakeData = true // true: 모델에서 가짜 데이터를 사용한다
    let personProto, makePerson, people, initModule

    // 프로토타입 사용. 매모리 사용량 감소 및 객체 성능 개선 목적.
    personProto = {
        get_is_user: function () {
            return this.cid === stateMap.user.cid
        },
        get_is_anonymous: function () {
            return this.cid === stateMap.anonymous_user.cid
        }
    }
    // Person 객체를 생성하여 TaffyDB 컬렉션에 저장. people_cid_map 내의 인덱스도 업데이트 한다.
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

    people = {
        get_db: function () {
            return stateMap.people_db
        }
        ,get_cid_map: function () {
            return stateMap.people_cid_map
        }
    }

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