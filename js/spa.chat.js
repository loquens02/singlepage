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
            + '    <div class="spa-chat-closer"></div>'
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
        slider_opened_em: 16,
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
    let getEmSize, setPxSizes, setSliderPosition, onClickToggle
    // --- /모듈 스코프 변수---

    // --- 유틸리티 메서드 ---
    /**
     * em 표시 단위를 px로 변환. jQuery 의 크기 단위를 사용할 수 있도록
     * @param elem em
     * @return {number} px
     */
    getEmSize = function (elem) {
        elem = elem ?? document.querySelector('spa-chat')
    
        return Number(
            getComputedStyle(elem, "").fontSize.match(/\d*\.?\d*/)[0]
        )
    }
    // --- /유틸리티 메서드 ---

    // --- DOM 메서드 ---
    /**
     * jQuery 컬렉션을 여러 개 캐싱하도록
     * #id 대신 .class 를 사용하면 페이지에서 2개 이상의 채팅 슬라이더를 사용할 수 있다
     * @function DOM 메서드
     */
    setJqueryMap = function () {
        const $append_target = stateMap.$append_target
        const $slider = $append_target.find('spa-chat')
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
        const px_per_em = getEmSize(jqueryMap.$slider.get(0))
        const opened_height_em = configMap.slider_opened_em
        stateMap.px_per_em = px_per_em
        stateMap.slider_closed_px = configMap.slider_closed_em * px_per_em
        stateMap.slider_opened_px = opened_height_em * px_per_em
        jqueryMap.$sizer.css({
            height: (opened_height_em - 2) * px_per_em
        })
    }

    /**
     * setSliderPosition API. 셸이 요청한 위치로 슬라이더 조정
     * @example spa.chat.setSliderPosition('closed')
     * @param position_type {Enumerator} 'closed', 'opened', 'hidden'
     * @param callback {function(document)} 애니메이션 완료 시점에 호출할 콜백 선택
     * @function 요청한 상태와 현재 상태가 일치하면 슬라이더를 현재 상태대로 둔다
     * - 요청한 상태와 현재 상태가 다르면, 요청한 상태로 애니메이션을 진행한다
     * @return true 요청한 상태로 전환한 경우, false 요청 상태로 전환하지 못한 경우
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
                toggle_text = '='
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
     * 초기화 이전에 모듈을 설정. 허용된 키의 설정 조정
     * @example spa.chat.configModule({slider_open_em:18})
     * @param input_map 설정 가능한 키와 값으로 구성된 맵. color_name: 사용할 색상
     * @param set_chat_anchor TODO 열린(opened) 상태나 닫힌(closed) 상태를 나타내게끔 URI 앵커를 수정하기 위한 콜백
     * <br> 요청한 상태를 반영할 수 없는 경우, 이 콜백에서는 false 를 반환해야 한다
     * @param chat_model TODO 채팅 모델 객체는 인스턴트 메시징과 상호작용하는 메서드를 제공한다
     * @param people_model TODO people 모델 객체는 모델에서 가진 사람들 목록을 관리하는 메서드를 제공한다
     * @param slider_* TODO 설정. 모든 설정은 스칼라값이다
     * @see mapConfig.settable_map 전체 설정목록
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
        setJqueryMap()
        setPxSizes()

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

    return { // 모듈 메서드를 외부로 노출한다. configModule, initModule 은 거의 모든 모듈에서 사용하는 표준 메서드
        setSliderPosition: setSliderPosition,
        configModule: configModule,
        initModule: initModule
    }
    // --- /public 메서드 ---
})()