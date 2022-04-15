/*
This file contains middleware that can check if a user is authenticated or can authenticate the user.
Basically, this middleware is responsible for allowing and denying access to other middleware and login the user.

Notes:
    Middleware:
        checkAuthenticated
            Check if the user is authenticated (logged in)
        checkUnauthenticated
            Check if the user is not authenticated (not logged in)
        authenticate
            Login the user and store their information in their session

Reference:
    Node.js Passport Login System Tutorial
        Reference:
            https://www.youtube.com/watch?v=-RCnNyD0L-s

 */

const passport = require('passport');
const debugPrinter = require('../util/debug_printer');

const middlewarePassport = {};

/**
 * Check if user is authenticated before allowing to execute the next middleware
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
middlewarePassport.checkAuthenticated = async (req, res, next) => {
    if (req.isAuthenticated()) {
        // console.log(req); // May or may not be undefined if user is not authenticated

        next();
    } else {

        res.render("index");

        // res.json({
        //     status: 'failed',
        //     message: 'User must be logged in to use this feature',
        // });
    }
};

/**
 * Check if user is NOT authenticated before allowing to execute the next middleware
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
middlewarePassport.checkUnauthenticated = async (req, res, next) => {
    if (req.isUnauthenticated()) {
        next();
    } else {

        res.render("index");

        // res.json({
        //     status: 'failed',
        //     message: `${req.user.username} you are logged in, you must not be logged in to use this feature`,
        // });
    }
};

function callbackCustomWrapper(req, res, next) {
    /*
    function to return a custom passport callback.
    Use this if you are not using passport.authenticate('local')

    Notes:
        This is the doneCallBack given to deserializeUser inside of handler_passport

        * The actual logging in is done by the req.logIn call

    Reference:
            Passport authentication with JWT: How can I change passport's default unauthorized response to my custom response?
                Notes:
                    "As per the official documentation of Passport you may use custom callback function to handle the case of failed
                    authorization and override the default message."

                Reference:
                    https://stackoverflow.com/a/56730006/9133458

            Custom Callback
                Notes:
                    Format used for this authenticate function
                Reference:
                    http://www.passportjs.org/docs/authenticate/#custom-callback

            How to show custom error messages using passport and express
                Notes:
                Reference:
                    https://stackoverflow.com/a/35455255/9133458

    */
    function callbackCustom(err, attributesAddedToReqUser, info) {
        // Standard error checking (error happened from 0
        if (err) {
            return next(err);
        }
        debugPrinter.printBackendMagenta(attributesAddedToReqUser)
        debugPrinter.printBackendGreen(info)
        /*
        If attributesAddedToReqUser was not given by the passport strategy.
        The strategy should have returned information that should be added req.user

        Notes:
            It's a very bad idea to tell the user what they failed on when they login, it is a security risk
         */
        if (!attributesAddedToReqUser) {

            // FIXME: REPLACE THIS REST API VERSION WITH THE NORMAL WAY OR MAKE THIS FUNCTION CALL next()
            // Unsuccessful login response
            res.status(403)
                .json({
                    status: 'failed',
                    message: 'Password/Username is invalid', // If you care about security
                    // message: info.message, // If you don't care about security use this instead of the above
                });


        } else {
            /*
            If null was given by the passport strategy.

            Login
                Notes:
                    This is the actual login, this will put the attributesAddedToReqUser in req.user and put req.user in
                    the session (express-session).
                    The req.login function comes from the passport package.

                Reference:
                    Log In
                        Notes:
                            "Passport exposes a login() function on req (also aliased as logIn()) that can be used to
                            establish a login session."

                            "When the login operation completes, user (attributesAddedToReqUser) will be assigned to req.user."

                            "Note: passport.authenticate() middleware invokes req.login() automatically.
                            This function is primarily used when users sign up, during which req.login()
                            can be invoked to automatically log in the newly registered user."

                        Reference:
                            https://www.passportjs.org/concepts/authentication/login/
            */
            req.logIn(attributesAddedToReqUser, async (errorPassportLogin) => {
                if (errorPassportLogin) {
                    next(errorPassportLogin);
                } else {

                    // FIXME: REPLACE THIS REST API VERSION WITH THE NORMAL WAY OR MAKE THIS FUNCTION CALL next()
                    // Successful login response
                    // res.status(200)
                    //     .json({
                    //         status: 'success',
                    //         message: 'You have successful login!',
                    //         user_id: req.user.user_id,
                    //         username: req.user.username,
                    //     });
                    

                    next()
                }
            });
        }
    }

    return callbackCustom;
}

/**
 * Mimic passport.authenticate function to allow for multiple different strategies and a custom callback function.
 * By mimicking passport.authenticate we now have access to different strategies other than 'local'.
 * The custom callback function allows us to have a RESTful API return
 *
 * @param strategy
 * @returns {middlewarePassportAuthenticatePseudo}
 */
function authenticate(strategy) {
    function middlewarePassportAuthenticatePseudo(req, res, next) {
        // This is the actual passport.authenticate
        console.log("in middlewareauth.authenticate");
        console.log(req.body);

        const middlewarePassportAuthenticate = passport.authenticate(
            strategy,
            callbackCustomWrapper(req, res, next), // This function should respond to the user if they have successfully logged in or not
            next,
        );

        middlewarePassportAuthenticate(req, res, next);
    }

    return middlewarePassportAuthenticatePseudo;
}

middlewarePassport.authenticate = authenticate;

module.exports = middlewarePassport;