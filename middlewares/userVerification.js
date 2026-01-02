import Middleware from '../resources/Middleware.js';
import Request from '../resources/Request.js';

const middleware = new class extends Middleware {
    identifier = "UserValidation";

    handle(request, next) {
        console.log(request);
        next();
    }
}

export default middleware;