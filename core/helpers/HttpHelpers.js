import Response from "#core/http/Response.js";
import Request from "#core/http/Request.js";

class HttpHelpers {

    static response;

    static handle() {
        HttpHelpers.defineResponse();
        HttpHelpers.defineRequest();
        HttpHelpers.defineHeaders();
    }

    static defineRequest() {
        DEFINE("request", (httpRequest = null) => new Request(httpRequest));
    }

    static defineResponse() {
        HttpHelpers.response = new Response();
        DEFINE("response", (session = null) => {
            if (!HttpHelpers.response)
                HttpHelpers.response = new Response(session);
            else
                HttpHelpers.response.session = session;

            HttpHelpers.defineHeaders(HttpHelpers.response);
            return HttpHelpers.response;
        });
    }

    static defineHeaders() {
        const callback = () => ({
            "toArray": () => HttpHelpers.response.headers.toObject(),
            "push": (key, value) => {
                HttpHelpers.response = HttpHelpers.response.addHeader(key, value);
                return HttpHelpers.response.headers.toObject();
            }, "remove": (key) => {
                return HttpHelpers.response.deleteHeader(key).then(response => {
                    HttpHelpers.response = response;
                    return HttpHelpers.response.headers.toObject()
                });
            }
        });

        DEFINE("headers", callback);
        DEFINE("header", callback);
    }
}

export default HttpHelpers;