// function scopeUndefined() {
// // current js version is not supporting
// // let (prisoner2 = 'I am in prison 2!'){
// //     console.log(prisoner2);
// // }
//
// // function prison(){
// //     // outOfPrisoner= 'I am global2!';
// // }
// // prison();
// // console.log(outOfPrisoner); // global 로 된댔는데 다시 실행하니 not defined
//
// }
//
// function scopeDefined() {
//     const regular_joe = 'I am global!';
//
//     function prison() {
//         const prisoner = 'I am local!';
//     }
//
//     prison();
// // console.log(regular_joe);
// // console.log(prisoner); // not defined
//
// // function prison(){
// //     for (i = 0; i < 5; i++) {
// //         console.log(i);
// //     }
// // }
// // prison();
// // console.log(i);
// // delete window.i;
//
//     function prison() {
//         // for(let i=0; i<5; i++){
//         let i; // for(안에) 선언한 것과 같은 스코프.
//         for (i = 0; i < 5; i++) {
//             // console.log(i)
//         }
//     }
//
//     prison();
//
// // console.log(i); // not defined. 의도했던 대로
//
//     function prison3() {
//         const prisoner = 'I am local!',
//             warden = 'I am local two',
//             guards = 'I am local three'
//         ;
//     }
//
//     const regular_joe4 = 'regular_joe4 is assigned'
//
//     function prison4() {
//         console.log('var: ', regular_joe4);
//         var regular_joe4 = 'a'; //
//     }
//
//     prison4()
//
//     const regular_joe4_2 = 'regular_joe4_2 is assigned' // scope 바깥은 관심없다.
//     function prison4_2() {
//         console.log('let: ', regular_joe4_2);
//         let regular_joe4_2 = 'a'; //
//     }
//
//     prison4_2()
//
//     // var regular_joe5= 'regular_joe5 is assigned'
//     // function prison5(regular_joe5) {
//     //     console.log(regular_joe5)
//     //     var regular_joe5='';
//     //     console.log(regular_joe5)
//     // }
//     // prison5('regular_joe2 is assigned')
// }
//
// function scopeChain() {
//     let regular_joe = 'I am here to save the day!';
// // console.log(regular_joe); // 전역
//     (function supermax() {
//         let regular_joe = 'regular_joe is assigned';
//
//         // console.log(regular_joe); // supermax's joe
//
//         function prison() {
//             let regular_joe;
//             // console.log(regular_joe); // prison's joe > undefined
//         }
//
//         prison();
//     })();
//     // supermax(); 와 ( function supermax(){..} )(); 와 같다. R언어에서 ( ) 한 번 씌우고 바로 실행하듯이.
//
//     let regular_joe2 = 'I am here to save the day!';
//     console.log(regular_joe2); // 전역
//     (function supermax2() {
//         console.log(regular_joe2); // scope에 없으니 전역
//         function prison() {
//             console.log(regular_joe2); // scope & 그 밖에도 없으니 전역
//         }
//
//         prison();
//     })();
// }
//
// function globalWindow() {
// // node.js 가 build 할 때, window, document 와 같은 전역 객체를 갖고 있지 않기 때문에 Error
// // [ReferenceError: window is not defined](https://www.sungikchoi.com/blog/window-is-not-available/)
//     if (typeof window !== "undefined") {
//         window.onload = function () {
//             window.alert('window loaded')
//         }
//     }
//
// // node.js 의 최상위 객체는 global. 브라우저가 아니라 서버단 객체이므로
//     const regular_joe = 'Global variable';
//     console.log(regular_joe);
//     if (typeof window !== "undefined") {
//         console.log(window.regular_joe)
//         console.log(regular_joe === window.regular_joe)
//     }
//
// // if (typeof window !== "undefined") {
// //     window.onload = function () {
// //         window.alert('window loaded')
// //     }
// // }
//
// // var regular_joe= 'Global variable';
// // console.log(regular_joe);
// // if (typeof window !== "undefined") {
// //     console.log(window.regular_joe)
// //     console.log(regular_joe === window.regular_joe)
// // }
// }