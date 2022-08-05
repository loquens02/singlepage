/**
 * login, logout test
 * @see spa.model.js
 */
spa.model.test = (function () {
    const logInOutTest = function () {
        $test = $('<div/>');
        $.gevent.subscribe($test, 'spa-login', function () {
            console.log('Hello!', arguments)
        });
        $.gevent.subscribe($test, 'spa-logout', function () {
            console.log('!Goodbye', arguments)
        });

        let currentUser = spa.model.people.get_user();
        currentUser.get_is_anonymous();

        const peopleDB = spa.model.people.get_db();

        peopleDB().each(function (person, idx) {
            console.log(person.name)
        });

        spa.model.people.login('Alfred');
        currentUser = spa.model.people.get_user();
        console.log(currentUser.get_is_anonymous());

        console.log(currentUser.id);

        console.log(currentUser.cid);
        //3초 대기

        // peopleDB().each(function(person, idx){console.log(person.name)});
        //
        // spa.model.people.logout()
        //
        // peopleDB().each(function(person, idx){console.log(person.name)});
        //
        // currentUser= spa.model.people.get_user();
        // currentUser.get_is_anonymous()
    }

    return {
        logInOutTest: logInOutTest
    }
})()