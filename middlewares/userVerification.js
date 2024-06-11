const middleware = new class {
    identifier = "UserValidation";

    next(request, response, next) {
        console.log("Middleware here's");
        next();
    }

}

module.exports = middleware;