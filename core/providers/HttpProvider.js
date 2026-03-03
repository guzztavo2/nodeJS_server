import Request from "#core/http/Request.js";
import Response from "#core/http/Response.js";
import Session from "#core/http/Session.js";

class HttpProvider {
    register(container) {
        container.bind('request', (container, req, res) =>
            new Request(req,  new Response(req)));
    }
}

export default HttpProvider;