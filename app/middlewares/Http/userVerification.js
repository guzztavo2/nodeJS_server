import Middleware from '#core/http/Middleware.js';
import Log from '#core/support/Log.js';
const middleware = new class extends Middleware {
    identifier = "UserValidation";

    handle(request, next) {
        Log.log("UserVerification Middleware executed");
        next();
    }
}

export default middleware;