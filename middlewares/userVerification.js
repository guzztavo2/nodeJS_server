import Middleware from '../resources/Middleware.js';
import Request from '../resources/Request.js';

const middleware = new class extends Middleware {
    identifier = "UserValidation";

    handle(request, next) {
        next();
    }
}

export default middleware;