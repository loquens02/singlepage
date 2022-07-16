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
        // --- 모듈 스코프 변수 ---
        /**
         * 정적 설정값
         * @type {{main_html: string, chat_extend_height: number, chat_extended_title: string, chat_retracted_title: string, anchor_schema_map: {chat: {closed: boolean, open: boolean}}, chat_retract_time: number, chat_retract_height: number, chat_extend_time: number}}
         * @function 모듈 스코프 변수
         */
        const configMap = {
            anchor_schema_map: { // uriAnchor 에서 유효성 검사에 사용할 맵 정의
                chat: { open: true, closed: true}
            },
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
            anchor_map: {}, // 현재 앵커 값을 모듈 상태 맵인 stateMap, anchor_map 에 저장한다
            is_chat_retracted: true, // 채팅 축소 상태. toggleChat() 함수를 호출하면 반대로 바뀜
        } // 모듈 사이에 공유하는 동적 정보

        let jqueryMap = {} // jQuery 컬렉션 객체 캐싱
        let setJqueryMap, initModule, toggleChat, onClickChat
        let copyAnchorMap, changeAnchorPart, onHashchange
        // --- /모듈 스코프 변수 ---

        // --- 유틸리티 메서드 ---
        /**
         * 저장된 앵커 맵의 복사본 반환 => 연산 부담 최소화
         * @returns {any|jQuery} jQuery.extend 유틸리티로 객체 복사. 그냥 넘기면 JS는 참조값만 전달하므로.
         * @function 유틸리티 메서드: 페이지 엘리먼트와 상호작용하지 않는 함수
         */
        copyAnchorMap = function (){
            return $.extend(true, {}, stateMap.anchor_map)
        }
        // --- /유틸리티 메서드 ---

        // --- DOM 메서드 ---
        /**
         * jQuery 컬렉션 객체 캐싱 > jQuery 문서 탐색 횟수 줄이기
         * @function DOM 메서드: 페이지 엘리먼트를 생성하고 조작하는 함수
         */
        setJqueryMap = function () { //
            const $container = stateMap.$container
            jqueryMap = {
                $container: $container,
                $chat: $container.find('.spa-shell-chat') // 채팅 슬라이더 jQuery 컬렉션 캐싱
            }
        }

        /**
         * URI 앵커 컴포넌트의 지정된 키-값만 업데이트
         * @param arg_map URI 앵커 중 변경하려는 맵. EX) {chat: 'open'}
         * @returns {Boolean} true: URI 앵커 부분 변경 성공, false: URI 앵커 부분 변경 실패
         * @see stateMap.anchor_map 앵커 저장 위치
         * @see uriAnchor 인코딩 방식
         * @desc
         * - copyAnchorMap() 을 사용해 이 맵을 복사한다.
         * - arg_map 을 사용해 키-값을 수정한다.
         * - 인코딩 과정에서 독립적인 값과 의존적인 값을 서로 구분한다.
         * - uriAnchor 를 활용해  URI 변경을 시도한다.
         * @function DOM 메서드: 페이지 엘리먼트를 생성하고 조작하는 함수
         */
        changeAnchorPart = function (arg_map){
            const anchor_map_revise= copyAnchorMap()
            let bool_return = true
            let key_name, key_name_dep

            // 변경 사항을 앵커 맵으로 합치는 작업 시작
            KEYVAL:
            for (key_name in arg_map) {
                if (arg_map.hasOwnProperty(key_name)) {
                    // 반복 과정 중 의존적 키는 건너뜀
                    if(key_name.indexOf('_') === 0){
                        continue KEYVAL // IDE warning: 불필요한 라벨이 있는 continue 문
                    }

                    // 독립적 키 값 업데이트
                    anchor_map_revise[key_name] = arg_map[key_name]

                    // 대응되는 의존적 키를 업데이트
                    key_name_dep = '_' + key_name
                    if(arg_map[key_name_dep]){
                        anchor_map_revise[key_name_dep] =  arg_map[key_name_dep]
                    }
                    else {
                        delete anchor_map_revise[key_name_dep]
                        delete anchor_map_revise['_s' + key_name_dep]
                    }
                }
            }
            // 변경 사항을 앵커 맵으로 합치는 작업 끝

            // URI 업데이트 시도. 실패하면 앵커 컴포넌트를 기존 상태로 복원한다.
            try {
                $.uriAnchor.setAnchor(anchor_map_revise)
            }
            catch (error) {
                // URI 를 기존 상태로 대체. 스키마에 부합하지 않으면 앵커를 설정하지 않는다
                $.uriAnchor.setAnchor(stateMap.anchor_map, null, true)
                bool_return = false
            }
            // URI 업데이트 시도 끝
            return bool_return
        }

        /**
         * 채팅 슬라이더 영역을 열고 닫는다.
         * 요구1-2. 채팅 슬라이더의 열기/닫기를 담당하는 단일 메서드를 만든다. 열기 닫기 속도 조절 가능.
         * @param do_extend true 이면 채팅 슬라이더를 열고, false 이면 닫는다
         * @param callback 애니메이션 종료 시점에 callback 함수 실행
         * @cfg chat_extend_time, chat_retract_time, chat_extend_height, chat_retract_height 설정
         * @cfg stateMap.is_chat_retracted true 이면 채팅 슬라이더를 닫고, false 이면 확장한다
         * @returns {boolean} true - 슬라이더 애니메이션이 실행된다, false - 슬라이더 애니메이션이 실행되지 않는다
         * @function DOM 메서드: 페이지 엘리먼트를 생성하고 조작하는 함수
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
        // --- /DOM 메서드 ---

        // --- 이벤트 핸들러 ---
        /**
         * hashchange 이벤트 처리
         * @return {boolean} false
         * @desc
         * - URI 앵커 컴포넌트를 파싱
         * - 새로운 애플리케이션 상태를 현재 상태와 비교
         * - 현재 상태와 다를 때만 애플리케이션의 상태를 변경
         */
        onHashchange = function () {
            const anchor_map_previous = copyAnchorMap()
            let anchor_map_proposed
            let _s_chat_previous, _s_chat_proposed, s_chat_proposed
            
            // 앵커 파싱 시도
            try {
                anchor_map_proposed = $.uriAnchor.makeAnchorMap()
            }
            catch (e) {
                $.uriAnchor.setAnchor(anchor_map_previous, null, true)
                return false
            }
            stateMap.anchor_map = anchor_map_proposed

            // 편의 변수
            _s_chat_previous = anchor_map_previous._s_chat
            _s_chat_proposed = anchor_map_proposed._s_chat
            // console.log(anchor_map_previous.hasOwnProperty('_s_chat')) // slider open-closed 시, true

            // 변경된 경우 채팅 컴포넌트 조정 시작
            if (!anchor_map_previous || _s_chat_previous !== _s_chat_proposed) {
                s_chat_proposed = anchor_map_proposed.chat
                switch (s_chat_proposed) {
                    case 'open': // caution: 무지성 copilot 하지 말 것.
                        toggleChat(true)
                        break;
                    case 'closed':
                        toggleChat(false)
                        break;
                    default:
                        toggleChat(false) // 기딴 거 들어오면 앵커 없는 걸로 URI 정하기
                        delete anchor_map_proposed.chat
                        $.uriAnchor.setAnchor(anchor_map_proposed, null, true)
                }
            }
            // 변경된 경우 채팅 컴포넌트 조정 끝

            return false
        }

        /**
         * 앵커의 chat 파라미터만 변경
         * @return {boolean} false
         * - 효과:
         * - jQuery 기본 동작을 수행하지 않도록 한다(링크 따라가기, 텍스트 선택 등) == event.preventDefault()
         * - jQuery 가 부모 DOM 엘리먼트에서 같은 이벤트를 트리거(버블링) 하지 않도록 한다 == event.stopPropagation()
         * - 해당 이벤트 핸들러 실행을 종료한다. 해당 핸들러가 다른 핸들러에도 연결되어 있다면 순서상 다음 핸들러를 실행한다 == event.stopImmediatePropagation()
         */
        onClickChat = function () {
            changeAnchorPart({
                chat: (stateMap.is_chat_retracted ? 'open' : 'closed')
            })
            return false
        }
        // --- /이벤트 핸들러 ---

        // --- public 메서드(외부 노출) ---
        /**
         * 모듈 초기화
         * - URI 스키마를 대상으로 유효성을 검사하게끔 uriAnchor 를 설정
         * - URI 앵커 변경 이벤트 처리
         * - HTML 을 로드한 후 jQuery 컬렉션 객체를 매핑
         * - 채팅 슬라이더 초기화 및 클릭 핸들러 바인딩
         * @param $container
         * @desc
         * @function public 메서드: 외부 노출
         */
        initModule = function ($container) {
            // stateMap 정의는 $(window).bind.trigger 보다 먼저 이뤄져야 한다.
            // HTML 을 로드한 후 jQuery 컬렉션 객체를 매핑한다
            stateMap.$container = $container
            $container.html(configMap.main_html)
            setJqueryMap()

            // 채팅 슬라이더 초기화 및 클릭 핸들러 바인딩
            stateMap.is_chat_retracted = true
            jqueryMap.$chat
                .attr('title', configMap.chat_retracted_title) //jQuery 를 포함시켜야 attr 메서드를 사용할 수 있다
                .click(onClickChat)

            // URI 스키마를 대상으로 유효성을 검사하게끔 uriAnchor 를 설정한다
            $.uriAnchor.configModule({
                schema_map : configMap.anchor_schema_map
            })

            // URI 앵커 변경 이벤트 처리
            // 이 작업은 모든 기능 모듈이 설정 및 초기화된 후에 수행된다
            // 이렇게 하지 않으면 페이지 로드 시점에 앵커를 판단하는 데 사용되는
            // 트리거 이벤트를 모듈에서 처리할 수 없게 된다
            // - hashchange 이벤트 핸들러를 바인딩하고, 초기 로드 시점에 모듈에서
            //   즐겨찾기 여부를 판단할 수 있게 바로 트리거한다.
            $(window)
                .bind('hashchange', onHashchange)
                .trigger('hashchange')
        }

        return {initModule: initModule}
        // 모듈 내보내기. 공개 메서드를 맴에 집어넣어 반환 > 외부에 명시적으로 노출
        // --- /public 메서드 ---
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