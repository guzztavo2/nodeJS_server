import Middleware from '#core/http/Middleware.js';
import Cli from '#core/support/Cli.js';
const middleware = new class extends Middleware {
    identifier = "UserValidation";

    handle(request, next) {
        Cli.log("UserVerification Middleware executed");
        next();
    }
}

export default middleware;