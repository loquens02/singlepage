/*
spa.shell.js
SPA 용 셀 모듈
 */
/*jslint            browser: true,      continue: true,
devel: true,        indent: 2,          maxerr:     50,
newcap: true,       nomen: true,        plusplus: true,
regexp: true,       sloppy: true,       vars:     false,
white:  true
 */
/*global $, spa */
spa.shell = (function () {
        // --- 모듈 스코프 변수 시작 ---
        const configMap = { // 정적 설정값
            main_html: String()
                + '<div class="spa-shell-head">'
                + '  <div class="spa-shell-head-logo"></div>'
                + '  <div class="spa-shell-head-acct"></div>'
                + '  <div class="spa-shell-head-search"></div>'
                + '</div>'
                + '<div class="spa-shell-main">'
                + '  <div class="spa-shell-main-nav"></div>'
                + '  <div class="spa-shell-main-content"></div>'
                + '</div>'
                + '<div class="spa-shell-foot"></div>'
                + '<div class="spa-shell-chat"></div>'
                + '<div class="spa-shell-modal"></div>',
            
            // 요구1-1. 슬라이더가 움직이는 속도와 높이를 개발자가 설정할 수 있다
            chat_extend_time: 250, // 채팅 연장 시간. 작을수록 빠름
            chat_retract_time: 300, // 채팅 축소 시간
            chat_extend_height: 450, // 채팅 연장 높이
            chat_retract_height: 15, // 채팅 축소 높이
            chat_extended_title: 'Click to retract', // 사용자 툴팁. 클릭하면 닫힙니다
            chat_retracted_title: 'Click to extend', // 사용자 툴팁. 클릭하면 열립니다
        }
        const stateMap = {
            $container: null,
            is_chat_retracted: true, // 채팅 축소 상태. toggleChat() 함수를 호출하면 반대로 바뀜
        } // 모듈 사이에 공유하는 동적 정보

        let jqueryMap = {} // jQuery 컬렉션 객체 캐싱
        let setJqueryMap, initModule, toggleChat, onClickChat
        // --- 모듈 스코프 변수 끝 ---

        // --- 유틸리티 메서드 시작 ---
        // 페이지 엘리먼트와 상호작용하지 않는 함수
        // --- 유틸리티 메서드 끝 ---

        // --- DOM 메서드 시작 ---
        // 페이지 엘리먼트를 생성하고 조작하는 함수
        // DOM 메서드 /setJqueryMap/ 시작
        setJqueryMap = function () { // jQuery 컬렉션 객체 캐싱 > jQuery 문서 탐색 횟수 줄이기
            const $container = stateMap.$container
            jqueryMap = {
                $container: $container,
                $chat: $container.find('.spa-shell-chat') // 채팅 슬라이더 jQuery 컬렉션 캐싱
            }
        }
        // DOM 메서드 /setJqueryMap/ 끝

        // DOM 메서드 /toggleChat/ 시작
        /**
         * 채팅 슬라이더 영역을 열고 닫는다
         * 요구1-2. 채팅 슬라이더의 열기/닫기를 담당하는 단일 메서드를 만든다. 열기 닫기 속도 조절 가능.
         * @param do_extend true 이면 채팅 슬라이더를 열고, false 이면 닫는다
         * @param callback 애니메이션 종료 시점에 callback 함수 실행
         * @cfg chat_extend_time, chat_retract_time, chat_extend_height, chat_retract_height 설정
         * @cfg stateMap.is_chat_retracted true 이면 채팅 슬라이더를 닫고, false 이면 확장한다
         * @returns {boolean} true - 슬라이더 애니메이션이 실행된다, false - 슬라이더 애니메이션이 실행되지 않는다
         */
        toggleChat = function (do_extend, callback) {
            const px_chat_ht = jqueryMap.$chat.height()
            const is_open = px_chat_ht === configMap.chat_extend_height
            const is_closed = px_chat_ht === configMap.chat_retract_height
            const is_sliding = !is_open && !is_closed
            if (is_sliding) {
                return false
            } // 요구1-3. 열리자마자 닫히는 경쟁조건 피하기. 슬라이더 애니메이션이 실행 중일 때는 함수 종료

            // 채팅 슬라이더 확장 시작
            if (do_extend) {
                jqueryMap.$chat.animate(
                    {height: configMap.chat_extend_height},
                    configMap.chat_extend_time,
                    function () {
                        jqueryMap.$chat.attr('title', configMap.chat_extended_title)
                        stateMap.is_chat_retracted = false
                        // 요구1-4. 슬라이더의 동작이 끝나는 시점에 '호출할 수 있는 콜백 함수'를 개발자가 임의로 넘겨줄 수 있다
                        if (callback) {
                            callback(jqueryMap.$chat)
                        }
                    }
                )
                return true
            }
            // 채팅 슬라이더 확장 끝

            // 채팅 슬라이더 축소 시작
            jqueryMap.$chat.animate(
                {height: configMap.chat_retract_height},
                configMap.chat_retract_time,
                function () {
                    jqueryMap.$chat.attr('title', configMap.chat_extended_title)
                    stateMap.is_chat_retracted = true
                    if (callback) {
                        //경쟁 조건을 피한다
                        callback(jqueryMap.$chat)
                    }
                }
            )
            return true
            // 채팅 슬라이더 축소 끝
        }
        // DOM 메서드 /toggleChat/ 시작


        // --- DOM 메서드 끝 ---

        // --- 이벤트 핸들러 시작 ---
        onClickChat = function () {
            toggleChat(stateMap.is_chat_retracted)
            return false
            // return false 효과
            // 1.jQuery 기본 동작을 수행하지 않도록 한다(링크 따라가기, 텍스트 선택 등) == event.preventDefault()
            // 2.jQuery 가 부모 DOM 엘리먼트에서 같은 이벤트를 트리거(버블링) 하지 않도록 한다 == event.stopPropagation()
            // 3.해당 이벤트 핸들러 실행을 종료한다. 해당 핸들러가 다른 핸들러에도 연결되어 있다면 순서상 다음 핸들러를 실행한다 == event.stopImmediatePropagation()
        }
        // --- 이벤트 핸들러 끝 ---

        // --- public 메서드(외부 노출) 시작 ---
        // public 메서드 /initModule/ 시작
        initModule = function ($container) {
            // HTML 을 로드한 후 jQuery 컬렉션 객체를 매핑한다
            stateMap.$container = $container
            $container.html(configMap.main_html)
            setJqueryMap()

            // 채팅 슬라이더 초기화 및 클릭 핸들러 바인딩
            stateMap.is_chat_retracted = true
            jqueryMap.$chat
                .attr('title', configMap.chat_retracted_title) //jQuery 를 포함시켜야 attr 메서드를 사용할 수 있다
                .click(onClickChat)
        }
        // public 메서드 /initModule/ 끝

        return {initModule: initModule}
        // 모듈 내보내기. 공개 메서드를 맴에 집어넣어 반환 > 외부에 명시적으로 노출
        // --- public 메서드 끝 ---
    }
)()

// 요구1-5. 토글 테스트. 슬라이더가 정상 작동하는지 확인
// setTimeout(function () {
//         toggleChat(true)
//     }, 3000 // 3초 후에 열림
// )
// setTimeout(function () {
//         toggleChat(false)
//     }, 8000 // 8초 후에 닫힘 (3+5초)
// )