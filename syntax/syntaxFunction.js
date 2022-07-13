function semicolonASI (){
    function getData() {
        return {
            // return
            // {
            name: 'Bob'
        }
    }
    console.log(getData())
}

function selfExecuting(){
    // 이거랑
    const prison = function () {
        // console.log('prison called')
    }
    prison()

    // 이거랑 같은 용도
    ;(function () {
        console.log('self- prison called')
    })()
}

function functionAndParam(){
    const sth= 'collector'
    ;(function (param) {
        const sentence= 'I wanna be the ' + param
        console.log(sentence)
    })(sth)

// // https://stackoverflow.com/a/1140438 - jquery import in js
// const script = document.createElement('script');
// script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js';
// document.getElementsByTagName('body')[0].appendChild(script);
//
// // jQuery 는 dom 조작 lib 인데 dom 없는 js 뿐이니 lib 불러오는 게 무의미
// // 그냥 $가 param 이고 jQuery 가 lib 에서 가져온 하나의 변수라는 것만 보면 된다
// ;(function ($) {
//     console.log($)
// })(jQuery)
}

// private 으로 일부를 감췄지만, 반환값 변경을 못 하는 부실한 모듈
function modulePrivatePoor(){
    // prisoner 와 sentence 변수만 반환
    const prison= (function () {
        const prisoner_name= 'Mike mm'
        const jail_term= '20 year term'
        return {
            prisoner: prisoner_name + ' - ' + jail_term,
            sentence: jail_term
        }
    })()

// console.log(prison.prisoner_name) //undefined - 반환한 것에 prisoner_name, jail_term 은 없으므로
    console.log(prison.prisoner) //Mike mm - 20 year term
    console.log(prison.sentence) //20 year term

    console.log(prison.jail_term) //undefined - 반환한 것에 prisoner_name, jail_term 은 없으므로
    prison.jail_term= 'Sentence commuted' // 새 속성 추가
    console.log(prison.jail_term) //Sentence commuted - 새로 추가한 속성값
    console.log(prison.prisoner) // Mike mm - 20 year term- 그러나 당연히 기존값은 변동이 없다.

}

// private 으로 일부를 감추고, 반환은 함수로 해서 반환값 변경 가능
function modulePrivateGreat() {
    const prison= (function () {
        const prisoner_name= 'Mike uu'
        let jail_term= '21 year term' // setJailTerm 에서 재할당하므로 let 필수

        return {
            prisoner: function () {
                return prisoner_name + ' - ' + jail_term
            },
            setJailTerm: function (term) {
                jail_term= term
            }
        }
    })()

    console.log(prison.prisoner()) //Mike uu - 21 year term
    prison.setJailTerm('31 year term')
    console.log(prison.prisoner()) //Mike uu - 31 year term

}