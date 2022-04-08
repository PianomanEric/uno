/*
This file is responsible for setting up the settings used by the passport package

Notes:
    passport.js is just middleware for authentication

Reference:
    Node.js Passport Login System Tutorial
        Notes:
            Brief understanding of the passport package
        Reference:
            https://www.youtube.com/watch?v=-RCnNyD0L-s

    Passport Local Configuration (Node + Passport + Express)
        Notes:
            In depth understanding of the passport package

            The "done" callback is the function that you pass the results of the authentication to.
            In this file the "done" callback is called "doneCallback"

        Reference:
            https://www.youtube.com/watch?v=xMEOT9J0IvI

    Passport Local Strategy Usage (Node + Passport + Express)
        Notes:
            In depth understanding of the passport package

            * Does have demonstration on how to authenticate different users

            done(null, false, {message: "whatever"})
                (argument 1) is an error, you can replace this with a string if you want, but this error should only
                be seen by the server

                (argument 2) is what should be put in the req unless it's false

                (argument 3) AKA info, is used for express-flash or some version of flash, you can catch it if you
                use a Custom Callback (http://www.passportjs.org/docs/authenticate/#custom-callback)

        Reference:
            https://www.youtube.com/watch?v=fGrSmBk9v-4&list=PLYQSCk-qyTW2ewJ05f_GKHtTIzjynDgjK&index=7

    Simple Passport Local Authentication w/ React & Node.js
        Notes:
            Basic the passport package understanding

            Has standard way of logging in using req.logIn

        Reference:
            https://www.youtube.com/watch?v=IUw_TgRhTBE&t=1538s

*/
const to = require('await-to-js').default;

const LocalStrategy = require('passport-local').Strategy;

const engineUser = require('./engine_user');
const debugPrinter = require('../util/debug_printer');
const handlerPassword = require('./handler_password');

// These are the fields that passport will look for in req.body
const REQ_BODY_FIELD_NAMES = {
    usernameField: 'username',
    passwordField: 'password',
};

const handlerPassport = {};

// Not used
const INVALID_LOGIN = 'Password/Username is invalid';

/**
 * Get the user to be Authenticated based on the username and password given
 *
 * Notes:
 *      username and password are taken from the request body (req.body.username, req.body.password).
 *      It knows to use "username" and "password" based on the naming given from REQ_BODY_FIELD_NAMES that you setup.
 *
 *      This function is custom made and specifically made for the local strategy given to the passport package
 *
 * @param username
 * @param password
 * @param doneCallback
 * @returns {Promise<*>}
 */
async function authenticateUser(username, password, doneCallback) {
    const user = await engineUser.getUserByUsername(username);

    // Invalid username
    if (user === null) {
        return doneCallback(
            null, // error (This must be null to allow the 3rd argument (info) to pass)
            false, // user
            {message: 'Invalid username'}, // info
        );
    }

    // if (process.env.NODE_ENV === 'development') {
    //     debugPrinter.printWarning(`HIT authenticateUser ${user}`);
    //     console.log(user);
    //     debugPrinter.printWarning(`HIT Password ${user.password}`);
    // }

    try {
        // If password is valid by comparing password from the req to the password in the db
        if (await handlerPassword.compare(password, user.password)) {
            // This doneCallback will attach the user object to req
            return doneCallback(
                null, // error (This must be null to allow the 3rd argument (info) to pass)
                user, // user
                {message: 'Success'}, // info
            );
        }
        // If password is invalid

        return doneCallback(
            null, // error (This must be null to allow the 3rd argument (info) to pass)
            false, // user
            {message: 'Invalid password'}, // info
        );
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.log('authenticateUser Error');
            console.log(error);
        }
        return doneCallback(error);
    }
}

/**
 * Configure passport to use a custom local strategy
 *
 * Reference:
 *      Simple Passport Local Authentication w/ React & Node.js
 *
 *      Notes:
 *          The code below is based on this code style
 *
 *      Reference:
 *          https://youtu.be/IUw_TgRhTBE?t=1538
 *
 * @param passport
 */
handlerPassport.configurePassportLocalStrategy = (passport) => {
    const localStrategy = new LocalStrategy(
        REQ_BODY_FIELD_NAMES,
        authenticateUser,
    );

    // Apply what local strategy to use
    passport.use(localStrategy);

    /*
    Store username in the passport of the session (Store cookie in browser)

    Notes:
        "Passport uses serializeUser function to persist user data (after successful authentication) into session."

        * Basically, determine what data of the user object should be stored in the session from user.
        Once a piece of data has been selected and passed to the done function, it will then be passed into req.session.passport.user (Note that req.session.passport.user is a key value pair).
        The data that was passed into the cookie will then be USED by passport.deserializeUser automatically once the user makes
        another request to the backend.

        *** THIS FUNCTION IS ONLY CALLED WHEN LOGGING IN AND THAT THE LOGIN IS VALID

        The thing stored in the session can be accessed via:
            req.session.passport.user

    Reference:
        Understanding passport serialize deserialize
            Reference:
                https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
     */
    passport.serializeUser((user, done) => {
        // if (process.env.NODE_ENV === 'development') {
        //     debugPrinter.printDebug('initializePassport serializeUser');
        // }
        /*
        Put the key (user.username) inside the passport of the session.
        It can be accessed via req.session.passport.user
         */
        done(null, user.username);
    });

    /*
    Validate the cookie's key from the client AND ADD PROPERTIES TO THE REQ

    Notes:
        "The first argument of deserializeUser corresponds to the key of the user object that was given to the done
        function"

        "Function deserializeUser is used to retrieve user data from session."

        * Basically, this will automatically get the value of req.session.passport.user and it is up to the backend developer
        to deal with that value, then the backend developer must then call the correct done function call. For example,
        if serializeUser had put a username in the done function, then the first argument of deserializeUser will contain the username.

        ** This function is called everytime a request is made to the backend WHEN THE USER IS ALREADY LOGGED IN.
        *** THIS FUNCTION IS RESPONSIBLE FOR PUTTING INFORMATION INTO req.user

        Can access user stuff from the req via:
            req.user

    Reference:
        Understanding passport serialize deserialize
            Reference:
                https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
     */
    passport.deserializeUser(async (username, done) => {
        // if (process.env.NODE_ENV === 'development') {
        //     debugPrinter.printDebug(`initializePassport deserializeUser ${username}`);
        // }

        // Get the userAndUserInformation via username
        const [error, userAndUserInformation] = await to(engineUser.getUserAndUserInformationByUsername(username));

        // If userAndUserInformation exists
        if (userAndUserInformation !== null) {
            // What ever data is sent to the second parameter of this function will be stored in req.user
            done(
                error, // error
                userAndUserInformation, // req.user
                {message: `${userAndUserInformation.username} was successfully logged in`}, // info
            );
        } else {
            // If getting userAndUserInformation is unsuccessful, then req.user will be null
            done(
                error, // error
                null, // req.user
                {message: 'Error happened in passport.deserializeUser'}, // info
            );
        }
    });
};

module.exports = handlerPassport;

// TODO CLEAN UP ENTIRE THING
