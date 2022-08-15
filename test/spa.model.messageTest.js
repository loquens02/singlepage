/**
 * message req/res test. 메시지 교환 테스트
 * @example spa.js/initModule, spa.html
 * @see spa.model.js
 */
spa.model.messageTest = (function () {
    const messageReqRes = function () {
        $test = $('<div/>'); // 브라우저 문서에 첨부되지 않은 jQuery 컬렉션

        // %test 제이쿼리 컬렉션이 Hello 콘솔.log 함수 를 사용해 spa-login 이벤트를 구독하게 한다
        $.gevent.subscribe($test, 'spa-login', function (event, user) {
            console.log('Hello!', user.name)
        });
        $.gevent.subscribe($test, 'spa-updatechat', function (event, chat_map) {
            console.log('Chat message: ', chat_map)
        });
        $.gevent.subscribe($test, 'spa-setchatee', function (event, chatee_map) {
            console.log('Chatee change: ', chatee_map)
        });
        $.gevent.subscribe($test, 'spa-listchange', function (event, changed_list) {
            console.log('*Listchange', changed_list)
        });

        // 로그인. 3초 후 spa-login 이벤트 발송 > 결과: 이 이벤트를 구독한 $test 의 함수가 호출된다
        // spa-listchange 이벤트도 발송된다
        // (왜? login() > userupdate event: completeLogin() > chat.join() === join_chat() > listchange evnet: publish_listChange() > spa-listchange)
        spa.model.people.login('Fanny')

        console.log('spa.model.chat.send_message(\'Hi Pebbles!\'): ' + spa.model.chat.send_message('Hi Pebbles!'))

        // ---------- 8초 대기 후 메시지 수신
        // 테스트를 위한 지연 필요. 메시지 수신 전에 다음 명령어 넣으면 반응이 없다.
        // js sleep https://www.daleseo.com/js-sleep/
        // - JS 는 싱글 스레드 방식이니 동기식 지연은 안 되고
        // - sleep(8000).then(() => 콘솔로그).then(주렁주렁) 다는 것도 싫고
        // - 테스트 함수 내에서 순차 실행을 위한 것이니 async function 뫄뫄(){ await sleep(8000) 이 적당하다고 본다

        // 메시지를 수신하면 채팅 상대가 설정된다.
        setTimeout(function () {
            console.log('spa.model.chat.send_message(\'What is up, tricks?\'): ' + spa.model.chat.send_message('What is up, tricks?'))
        }, 14000)
        // spa.model.chat.send_message('What is up, tricks?')

        // 채팅 상대를 Pebble 로 설정
        setTimeout(function () {
            console.log('spa.model.chat.set_chatee(\'id_03\')'+spa.model.chat.set_chatee('id_03'))
        }, 14000)
        // spa.model.chat.set_chatee('id_03')

        setTimeout(function () {
            console.log('spa.model.chat.send_message(\'Hi Pebbles!\')'+spa.model.chat.send_message('Hi Pebbles!'))
        }, 14000)
        // spa.model.chat.send_message('Hi Pebbles!')
    }

    return {
        messageReqRes: messageReqRes
    }
})()