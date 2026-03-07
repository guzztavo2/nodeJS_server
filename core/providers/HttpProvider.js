import Request from "#core/http/Request.js";
import Response from "#core/http/Response.js";
import Session from "#core/http/Session.js";

class HttpProvider {
    register(container) {
        container.bind("session", (httpRequest) => new Session(httpRequest));
        container.bind("response", (httpResponse = null) => new Response(httpResponse));
        container.bind("request", (httpRequest = null) => new Request(httpRequest));
    }
}

export default HttpProvider;