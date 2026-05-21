import Log from '#core/support/Log.js';
const middleware = new class {
    identifier = "UserValidation";

    handle(request) {
        Log.log("UserVerification Middleware executed");
        return true;
    }
}

export default middleware;