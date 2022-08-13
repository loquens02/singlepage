/**
 * join test
 * @example spa.js/initModule, spa.html
 * @see spa.model.js
 */
spa.model.chat.join.test = (function () {
    const joinTest = function () {
        $test = $('<div/>');

        // %test 제이쿼리 컬렉션이 Hello 콘솔.log 함수 를 사용해 spa-login 이벤트를 구독하게 한다
        $.gevent.subscribe($test, 'spa-login', function () {
            console.log('Hello!', arguments)
        });
        $.gevent.subscribe($test, 'spa-listchange', function () {
            console.log('*Listchange', arguments)
        });
        
        // 현재 사용자 객체를 가져온다
        let currentUser = spa.model.people.get_user();
        // 아직 로그인 상태가 아니다
        currentUser.get_is_anonymous();
        // 로그인 하지 않고 채팅방 참여 시도. API 명세에 따르면 거부해야 옳다
        spa.model.chat.join()

        // -------------------

        spa.model.people.login('Fred')
        //
        // 사람들 컬렉션 가져오기. TAFFY DB.
        let peopleDB = spa.model.people.get_db();
        // 컬렉션에 있는 모든 사람 이름 표시. (Fred 와 익명이랬는데, 다 가져온다)
        peopleDB().each(function (person, idx) {
            console.log(person.name)
        });

        // -------------------

        // spa.model.chat.join()
        // // join 이후 1초 이내에 spa-listchange 이벤트 발송
        //
        // // 사용자 목록을 다시 확인
        // peopleDB = spa.model.people.get_db();
        // peopleDB().each(function(person, idx){
        //     console.log(person.name)
        // });
    }

    return {
        joinTest: joinTest
    }
})()