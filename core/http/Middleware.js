import Request from "#core/http/Request.js";
class Middleware {
    next(request, response, next){
        return this.handle(new Request(request, response), next);
    }     
}
export default Middleware;