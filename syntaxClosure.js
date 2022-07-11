// 외부에서 내부 변수를 사용하도록 코딩하면 클로저가 생성된다
// 클로저: 가비지 컬렉터가 내부 변수를 삭제하지 못 하도록 막는 지킴이/절차/코딩 패턴
function closureBase() {
    // 클로저가 생성되지 않는 경우
    const prisonNone= (function () {
        const prisoner= 'Mike uu'
        return {prisoner: prisoner} // 반환된 prisoner 에는 변수가 아니라 문자열만 들어있다
    })()
// console.log(prisonNone.prisoner)

    // 클로저 예제1
    const prison1= (function () {
        const prisoner= 'Mike uu' // 함수 실행할 때마다 접근

        return {
            prisoner: function () {
                return prisoner
            }
        }
    })()
// console.log(prison1.prisoner())

    // 클로저 예제2
    const makePrison= function (prisoner) {
        return function (){
            return prisoner // prisoner 변수에 접근중이므로 클로저(가비지 컬렉터 막이)가 생성된다
        }
    }
    const johnPrison= makePrison('John')
    const mikePrison= makePrison('Mike')
}

// cf. spa.html/ajax 호출에서 this(Good). dom 과 함께 둬야 정상실행가능
function closureAjax() {
    // 클로저 예제3- this
    const prisonNormal= {
        names: 'Mike and John',
        who: function () {
            return this.names;
        }
    }
    // console.log(prisonNormal.who()) //Mike and John

    // 클로저 예제4- Ajax 에서 this 는 Ajax 호출 자체
    // 이건 html dom 코드 연계해서 실행해야 > spa.html 하단부
    const prison= {
        names: 'John and Mike',
        who: function () {
            $.ajax({
                success: function () {
                    console.log(this.names)
                }
            })
        }
    }
    prison.who() //
}

// 클로저 작동 원리 예제1- 함수 호출시 실행 컨텍스트 객체가 생성되고, 그 객체에 대한 참조개수가 1이 된다
function closureHowtoByExecutionContext1() {
    const makePrison= function (prisoner) {
        return function () {
            return prisoner;
        }
    }
    const johnPrison= makePrison('John')
    const mikePrison= makePrison('Mike')

    console.log(johnPrison()) // John - johnPrison() 함수 실행 > 실행 컨텍스트 객체 생성 > 해당 객체에 포인터 존재
    // johnPrison()에 대한 포인터의 참조 개수는 1
    console.log(mikePrison()) // Mike
    // mikePrison()에 대한 포인터의 참조 개수는 1

    console.log(johnPrison()) // John - johnPrison() 을 한 번 더 호출 - 앞서 호출했을 때 생성한 실행 컨텍스트 객체에 설정된 값 사용

    // 위에서 생성된 실행 컨텍스트 객체는 변수 johnPrison, mikePrison 을 삭제하기 전까지 계속 유지된다.

}

// 클로저 작동 원리 예제2- cf.spa.html --Fail- 이제는 window 로 실행 컨텍스트 객체 접근이 안 되나?
function closureHowtoByExecutionContext2() {
    let curryLog, logHello, logStayInAlive, logGoodbye
    curryLog= function (arg_text) {
        const log_it= function () {
            console.log(arg_text)
        }
        return log_it
    }
    logHello= curryLog('hello')
    logStayInAlive= curryLog('stayin alive!')
    logGoodbye= curryLog('goodby')
    // 여기까지는 실행 컨텍스트에 대한 참조를 생성하지 않는다
    // 따라서 실행 컨텍스트 객체는 가비지 컬렉터에 의해 바로 제거될 수 있다.

    curryLog('fred')

    logHello() // hello
    logStayInAlive() // stayin alive!
    logGoodbye() // goodby
    logHello() // hello
    // ?[M]함수를 호출하여 각각에 대해 실행 컨텍스트에 대한 참조 생성?

    if (typeof window !== "undefined") { // 브라우저에서 동작
        delete window.logHello // 'hello' 의 실행 컨텍스트 객체에 대한 참조를 제거한다
        delete window.logStayInAlive // 'stayin alive!' 의 실행 컨텍스트 객체에 대한 참조를 제거한다
    }
    logGoodbye()
    logStayInAlive() // 책의 의도: undefined
}

// 클로저 예제3- 이거 이해하면 클로저 졸업.
function closureHowtoByExecutionContext3(){
    let menu
    const food= 'cake'
    const outer_function= function () {
        const fruit = 'apple'
        const inner_function= function () {
            return {food:food, fruit:fruit}
        }
        return inner_function
    }

    menu= outer_function()
    // 함수 실행 => 실행 컨텍스트 생성
    // inner_function 은 outer_function 함수의 실행 컨텍스트 내부에 정의 된다
    
    // inner_function 이 outer_function 의 실행 컨텍스트 내부에 정의되어 있으므로, outer_function scope 에 있는 모든 변수에 접근 가능
    // [food, fruit, outer_function, inner_function, menu] 에 접근 가능

    console.log(menu()) //{ food: 'cake', fruit: 'apple' }

    // outer_function() 함수 실행을 마친 후에도 실행 컨텍스트가 제거되지 않고 유지된다!!
    // 이유: inner_function 함수에 대한 참조가 스코프 바깥 변수인 menu 에 저장되어 있기 때문이다.
    // inner_function 은 선언 위치를 기준으로 스코프 내에 선언된 모든 변수에 대한 접근을 유지할 수 있어야 하므로
    // outer_function 실행 컨텍스트를 감싸고, 가비지 컬렉터가 해당 실행 컨텍스트를 제거할 수 없게 한다
    // == 클로저
}

// 클로저 예제4- cf. spa.html
;(function closureHowtoByExecutionContext4(){
    function sendAjaxRequest($) {
        const scope_var= 'yay'
        $.ajax({
            success: function () {
                console.log(scope_var)
            }
        });
    }
    sendAjaxRequest(jQuery);
})()