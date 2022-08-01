/*
spa.chat.js
SPA 용 채팅 기능 모듈
 */
/*jslint            browser: true,      continue: true,
devel: true,        indent: 2,          maxerr:     50,
newcap: true,       nomen: true,        plusplus: true,
regexp: true,       sloppy: true,       vars:     false,
white:  true
 */
/*global $, spa, getComputedStyle */
spa.chat = (function () {
    // --- 모듈 스코프 변수 ---
    const configMap = {
        main_html: String()
            + '<div class="spa-chat">'
            + '    <div class="spa-chat-head">'
            + '        <div class="spa-chat-head-toggle">+</div>'
            + '        <div class="spa-chat-head-title">Chat</div>'
            + '    </div>'
            + '    <div class="spa-chat-closer">x</div>'
            + '    <div class="spa-chat-sizer">'
            + '        <div class="spa-chat-msgs"></div>'
            + '        <div class="spa-chat-box"><input type="text"/>'
            + '            <div>send</div>'
            + '        </div>'
            + '    </div>'
            + '</div>',

        /*+ '<div class="padding:1em; color:#fff;">'
        + '  say hello to chat'
        + '</div>',*/

        /*모든 채팅 설정을 이 모듈에 옮김*/
        settable_map: {
            slider_open_time: true,
            slider_close_time: true,
            slider_opened_em: true,
            slider_closed_em: true,
            slider_opened_title: true,
            slider_closed_title: true,
            chat_model: true,
            people_model: true,
            set_chat_anchor: true
        },
        slider_open_time: 250,
        slider_close_time: 250,
        slider_opened_em: 18,
        slider_opened_min_em: 10,
        /*창의 최소 높이. 창이 이 값보다 작다면 슬라이더를 최소 높이로 설정*/
        window_height_min_em: 20,
        slider_closed_em: 2,
        slider_opened_title: 'Click to close',
        slider_closed_title: 'Click to open',
        chat_model: null,
        people_model: null,
        set_chat_anchor: null
    }

    let stateMap = {
        $append_target: null,
        position_type: 'closed',
        px_per_em: 0,
        slider_hidden_px: 0,
        slider_closed_px: 0,
        slider_opened_px: 0
        // $container: null
    }
    let jqueryMap = {}
    let setJqueryMap, configModule, initModule
    let setPxSizes, setSliderPosition, onClickToggle //,getEmSize
    let removeSlider, handleResize
    // --- /모듈 스코프 변수---

    // --- 유틸리티 메서드 ---
     /* em 표시 단위를 px로 변환. jQuery 의 크기 단위를 사용할 수 있도록
     * @param elem em
     * @return {number} px
     *
     * spa.util_b 와 중복

    getEmSize = function (elem) {
        return Number(
            getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*!/)[0]
        )
    }*/

    // --- /유틸리티 메서드 ---

    // --- DOM 메서드 ---
    /**
     * jQuery 컬렉션을 여러 개 캐싱하도록
     * #id 대신 .class 를 사용하면 페이지에서 2개 이상의 채팅 슬라이더를 사용할 수 있다
     * @function DOM 메서드
     */
    setJqueryMap = function () {
        const $append_target = stateMap.$append_target
        const $slider = $append_target.find('.spa-chat')
        // 이틀 헤멘 에러 history- . 안 찍어서- const $slider = $append_target.find('spa-chat')
        // let $container = stateMap.$container

        jqueryMap = {
            $slider: $slider,
            $head: $slider.find('.spa-chat-head'),
            $toggle: $slider.find('.spa-chat-head-toggle'),
            $title: $slider.find('.spa-chat-head-title'),
            $sizer: $slider.find('.spa-chat-sizer'),
            $msgs: $slider.find('.spa-chat-msgs'),
            $box: $slider.find('.spa-chat-box'),
            $input: $slider.find('.spa-chat-input input[type=text]')
        }
        // jqueryMap = {$container: $container}
    }

    /**
     * 이 모듈에서 관리하는 엘리먼트의 픽셀 크기 계산
     * @function DOM 메서드
     */
    setPxSizes = function () {
        const px_per_em = spa.util_b.getEmSize(jqueryMap.$slider.get(0))
        const window_height_em = Math.floor(($(window).height() / px_per_em) + 0.5) // 창 높이 단위 em
        const opened_height_em = window_height_em > configMap.window_height_min_em
                                ? configMap.slider_opened_em : configMap.slider_opened_min_em

        stateMap.px_per_em = px_per_em
        stateMap.slider_closed_px = configMap.slider_closed_em * px_per_em
        stateMap.slider_opened_px = opened_height_em * px_per_em
        jqueryMap.$sizer.css({
            height: (opened_height_em - 2) * px_per_em
        })
    }
    // --- /DOM 메서드 ---

    // --- 이벤트 핸들러 ---
    /**
     * URI 앵커를 변경하는 메서드 호출
     * @return {boolean} false - 셸에 있는 hashchage 이벤트 핸들러에게 변경 사항 처리 위탁 후 바로 종료
     * @function 이벤트 핸들러
     */
    onClickToggle = function () {
        const set_chat_anchor = configMap.set_chat_anchor
        if (stateMap.position_type === 'opened') {
            set_chat_anchor('closed')
        } else if (stateMap.position_type === 'closed') {
            set_chat_anchor('opened')
        }
        return false
    }
    // --- /이벤트 핸들러 ---

    // --- public 메서드 ---
    /**
     * setSliderPosition API. 셸이 요청한 위치로 슬라이더 조정
     * @example spa.chat.setSliderPosition('closed')
     * @param position_type {Enumerator} 'closed', 'opened', 'hidden'
     * @param callback {function(document)} 애니메이션 완료 시점에 호출할 콜백 선택
     * @function public 메서드- 요청한 상태와 현재 상태가 일치하면 슬라이더를 현재 상태대로 둔다
     * - 요청한 상태와 현재 상태가 다르면, 요청한 상태로 애니메이션을 진행한다
     * @return true 요청한 상태로 전환한 경우, false 요청 상태로 전환하지 못한 경우
     * @see p.181
     */
    setSliderPosition = function (position_type, callback) {
        let height_px, animate_time, slider_title, toggle_text

        // 슬라이더가 이미 요청한 위치에 있으면 true 를 반환
        if (stateMap.position_type === position_type) {
            return true
        }

        // 애니메이션 파라미터 준비
        switch (position_type) {
            case 'opened':
                height_px = stateMap.slider_opened_px
                animate_time = configMap.slider_open_time
                slider_title = configMap.slider_opened_title
                toggle_text = '-'
                break;
            case 'hidden':
                height_px = 0
                animate_time = configMap.slider_open_time
                slider_title = ''
                toggle_text = '+'
                break;
            case 'closed':
                height_px = stateMap.slider_closed_px
                animate_time = configMap.slider_close_time
                slider_title = configMap.slider_closed_title
                toggle_text = '+'
                break;
            // 알 수 없는 position_type 이면 false 를 반환
            default:
                return false
        }

        // 슬라이더 위치 변경 애니메이션
        stateMap.position_type = ''
        jqueryMap.$slider.animate(
            {height: height_px},
            animate_time,
            function () {
                jqueryMap.$toggle.prop('title', slider_title)
                jqueryMap.$toggle.text(toggle_text)
                stateMap.position_type = position_type
                if(callback) {
                    callback(jqueryMap.$slider)
                }
            }
        )
        return true
    }

    /**
     * 초기화 이전에 모듈을 설정. 허용된 키의 설정 조정
     * @example spa.chat.configModule({slider_open_em:18})
     * @param input_map 설정 가능한 키와 값으로 구성된 맵. color_name: 사용할 색상
     * @cfg set_chat_anchor 열린(opened) 상태나 닫힌(closed) 상태를 나타내게끔 URI 앵커를 수정하기 위한 콜백
     * 요청한 상태를 반영할 수 없는 경우, 이 콜백에서는 false 를 반환해야 한다
     * @cfg chat_model 채팅 모델 객체는 인스턴트 메시징과 상호작용하는 메서드를 제공한다
     * @cfg people_model people 모델 객체는 모델에서 가진 사람들 목록을 관리하는 메서드를 제공한다
     * @cfg slider_* 설정. 모든 설정은 스칼라값이다
     * @see mapConfig.settable_map 전체 설정목록, cfg => spa.chat.configModule
     * @return {Boolean} true
     * @function public 메서드 - 넘겨받은 인자를 사용해 내부 설정 데이터 객체(configMap)를 업데이트 한다.
     * @exception JS 에러 객체 및 넘겨받을 수 없거나 누락된 인자에 대한 스택 트레이스
     */
    configModule = function (input_map) {
        spa.util.setConfigMap({
            input_map: input_map,
            settable_map: configMap.settable_map,
            config_map: configMap
        })
        return true
    }

    /**
     * remove chatSlider DOM element
     * - restore the state of the chatSlider to its initial state
     * - detach callback and pointer of other data
     * - 인증 기능이 있다면 로그아웃할 때 채팅 슬라이더를 완전히 제거해야 한다
     * @return true
     * @function public 메서드. Chat 이 첨부된 DOM 컨테이너를 제거하고 초기화와 설정을 순서대로 되돌린다.
     */
    removeSlider = function () {
        // restore the state of the chatSlider to its initial state
        // remove DOM container. 컨테이너 제거 시 이벤트 바인딩도 함께 제거된다
        if(jqueryMap.$slider) {
            jqueryMap.$slider.remove()
            jqueryMap = {}
        }
        stateMap.$append_target = null
        stateMap.position_type = 'closed'

        // 키 설정 초기화
        configMap.chat_model = null
        configMap.people_model = null
        configMap.set_chat_anchor = null

        return true
    }

    /**
     * Adapt the presentation provided by this module as needed when the window resize event occurs
     * - 창 리사이즈 이벤트가 일어나면 필요에 따라 이 모듈에서 제공하는 프레젠테이션을 조정
     * @return false When resizing is unnecessary
     * @return true When resizing is necessary
     * @function public 메서드. 창 높이나 너비가 최소 크기 미만이면 줄어든 창 크기에 맞춰 채팅 슬라이더 크기 변경
     * @see p.198 생성
     */
    handleResize = function () {
        // 슬라이더 컨테이너가 없으면 아무 것도 하지 않는다
        if( !jqueryMap.$slider ) {
            return false
        }

        setPxSizes()
        // opened 일 경우, 창 리사이즈 이벤트가 일어나는 동안 setPxSize 에서 계산한 값으로 슬라이더 높이 재설정
        if(stateMap.position_type === 'opened') {
            jqueryMap.$slider.css({
                height: stateMap.slider_opened_px // copilot: String(stateMap.slider_opened_em) + 'em'
            })
        }
        return true
    }

    /**
     * initModule API. Chat 기능 모듈이 사용자에게 기능을 제공하게끔 지시
     * @example spa.chat.initModule( $('#div_id') )
     * @param $append_target (예시: $('#div_id') ) 단일 DOM 컨테이너를 나타내는 제이쿼리 컬렉션
     * @function public 메서드 - 채팅슬라이더를 인자로 받은 컨테이너에 첨부하고 HTML 컨텐츠로 그 내용을 채운다
     * - 그 다음 채팅방 인터페이스를 사용자에게 제공하기 위해 엘리먼트, 이벤트, 핸들러를 초기화한다
     * @return true 성공, false 실패
     */
    initModule = function ($append_target) {
        $append_target.append(configMap.main_html)
        stateMap.$append_target = $append_target
        setJqueryMap() //순서1
        setPxSizes() //순서2

        // 기본 제목 및 상태로 채팅 슬라이더 초기화
        jqueryMap.$toggle.prop('title', configMap.slider_closed_title)
        jqueryMap.$head.click(onClickToggle)
        stateMap.position_type = 'closed'
        return true
    }

    /* $container 관련 코드 주석
     * 채팅 모듈을 초기화한다.
     * @param $container $container 기능에서 사용하는 컨테이너
     * @return {boolean}
     * @function initModule 모든 실행을 시작한다. 거의 모든 모듈에 들어있는 것
     */
    /*initModule = function ($container) {
        $container.html(configMap.main_html) // 채팅 슬라이더 컨테이너를 HTML 템플릿으로 채우기
        stateMap.$container = $container
        setJqueryMap()
        return true
    }*/

    // 모듈 메서드를 외부로 노출한다. configModule, initModule 은 거의 모든 모듈에서 사용하는 표준 메서드
    // example: spa.chat.메서드
    return {
        setSliderPosition: setSliderPosition,
        configModule: configModule,
        initModule: initModule,
        removeSlider: removeSlider,
        handleResize: handleResize
    }
    // --- /public 메서드 ---
})()