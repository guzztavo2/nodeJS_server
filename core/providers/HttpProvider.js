import Request from "#core/http/Request.js";
import Response from "#core/http/Response.js";
import Session from "#core/http/Session.js";
import Router from "#core/http/Router.js";

class HttpProvider {
    register(container) {
        container.bind("session", () => new Session());
        container.bind("request", (httpRequest = null) => new Request(httpRequest));
        container.bind("route", () => new Router());
        container.bind("httpRequest", (httpRequest) => Request.setHttpRequest(httpRequest));
        container.bind("httpResponse", (httpResponse) => Response.setHttpResponse(httpResponse));
    }
}

export default HttpProvider;