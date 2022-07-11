// prototype 방법1 가장 많이 쓰지만 핵심개념을 놓치기 쉽다
function prototypeByNew(){
    const proto= { // 해당 종의 공통 요소
        sentence: 4,
        probation: 2
    };
    const Prisoner= function(name, id){ // 개체별 차이점
        this.name= name;
        this.id= id;
    }
    Prisoner.prototype= proto; // 연결

    const firstPrisoner= new Prisoner('Joe','12A')
    const secondPrisoner= new Prisoner('Sam','2BC')
}

// prototype 방법2-1 안 쓰는 방법
function prototypeByCreateNoUse() {
    const proto= {
        sentence: 4,
        probation: 2
    };

    let firstPrisoner= Object.create(proto);
    firstPrisoner.name= 'Joe'
    firstPrisoner.id= '12A'

    let secondPrisoner= Object.create(proto);
    secondPrisoner.name= 'Sam'
    secondPrisoner.id= '2BC'
}

// prototype 방법2-2 권장하는 방법
function prototypeByCreateRecommend() {
    const proto= {// 해당 종의 공통 요소
        sentence: 4,
        probation: 2
    };
    const makePrisoner= function(name,id){ // 묶어 주는 팩터리 메서드
        let prisoner= Object.create(proto);
        prisoner.name= name; // 개별 개체의 특징
        prisoner.id= id;
        return prisoner;
    };
    const firstPrisoner= makePrisoner('Joe','12A')
    const secondPrisoner= new makePrisoner('Sam','2BC')
}

// Object.create 호환성- IE 9~, ff 4~, safari 5~, ch 5~
function objCreateCompatibility() {
    const objectCreate= function(arg){
        if(!arg) {return {};}
        function obj() {};
        obj.prototype= arg;
        return new obj;
    };
    Object.create= Object.create || objectCreate;
}

// prototype chain
function prototypeChain(){
    const proto= {
        sentence: 4,
        probation: 2
    };
    const makePrisoner= function (name, id) {
        let prisoner= Object.create(proto);
        prisoner.name= name;
        prisoner.id= id;
        // prisoner.toString= Object.assign(prisoner, prisoner.__proto__) // toString: [Circular *1]  순환참조- https://stackoverflow.com/q/11616630

        return prisoner;
    };
    const firstPrisoner= makePrisoner('Joe','12A');
    const secondPrisoner= makePrisoner('Sam','2BC');

// console.log(firstPrisoner); // 개체 특성만 출력. (책에서는 객체 전체가 출력된다 그랬는데..)
// console.log(firstPrisoner.__proto__); // 해당 종의 공통 요소 출력
//
// // ??? 그럼 전체 요소를 출력하려면?
// // toString 재정의하고 싶은데, 일단 보류. super 가 있나 궁금해지는데 그것도 보류.
// // super 가 있긴 하지만 양념 문법 class 에 있는 걸 보니 별로 권장하는 건 아닌 듯. 그렇다면 prototype chain 내에서 동일 변수 있는 것도 바람직 하지 않겠네.
// // https://developer.mozilla.org/ko/docs/Web/JavaScript/Inheritance_and_the_prototype_chain
    const showObj= function (proto) {
        return Object.assign(proto, proto.__proto__);
        // prototype 을 깊게 갖고 있는 객체라면 재귀적으로 받아서 return 해야 할 텐데, 정녕 문법이 없나??
    };
// console.log(showObj(firstPrisoner));
// // console.log(firstPrisoner.toString); //[Function: toString]
//
// console.log(firstPrisoner.__proto__.__proto__) // {} - Object
// console.log(firstPrisoner.__proto__.__proto__.__proto__) // null - Object.__proto__ 는 없으므로
//
// console.log(firstPrisoner.aaa) // undefined - 해당 개체에서 Object 까지 누구도 갖고 있지 않으므로
// // 존재하지도 않는 속성을 찾는 것은 성능에 악영향 > prototype chain 전체를 순회해야 하므로
// console.log(firstPrisoner.hasOwnProperty('aaa')) // false
// console.log(firstPrisoner.hasOwnProperty('sentence')) // true
//
// console.log(firstPrisoner.sentence) // 4 - firstPrisoner.__proto__ 에서 찾음
// console.log(firstPrisoner.toString()) // [object Object] - toString 은 Object에 있다

// // prototype 에 있지만 개별 개체에 같은 이름의 다른 속성 부여해보기 - 권장하지 않지만 proto 이해용
// console.log(firstPrisoner.sentence) //4 - proto
// console.log(firstPrisoner.__proto__.sentence) // 4 - proto
// firstPrisoner.sentence = 10; // 개별 개체에 공통 요소와 이름만 같은 새 속성 부여
//
// console.log(firstPrisoner.sentence) // 10 - 개별 개체에 있으니
// console.log(firstPrisoner.__proto__.sentence) // 4 - proto
// delete firstPrisoner.sentence // 개별 개체의 sentence 제거
//
// console.log(firstPrisoner.sentence)
// console.log(firstPrisoner.__proto__.sentence)

// prototype 변경해서 모든 개체의 값을 일괄적으로 변경하기
    console.log(firstPrisoner.sentence) //4
    console.log(secondPrisoner.sentence) //4

    proto.sentence= 5

    console.log(firstPrisoner.sentence) //5
    console.log(secondPrisoner.sentence) //5

}
