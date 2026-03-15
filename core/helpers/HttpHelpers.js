import Utils from "#core/support/Utils.js";
import Response from "#core/http/Response.js";
import Request from "#core/http/Request.js";

class HttpHelpers {

    static response;
    static handle() {
        HttpHelpers.response = new Response();
        Utils.define_global("response", (session = null) => {
            if (!HttpHelpers.response)
                HttpHelpers.response = new Response(session);
            else
                HttpHelpers.response.session = session;
            
            HttpHelpers.define_headers(HttpHelpers.response);
            return HttpHelpers.response;
        });

        Utils.define_global("request", (httpRequest = null) => new Request(httpRequest));
        this.define_headers();
    }

    static define_headers() {
        const callback = () => {
            return {
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
            }
        };
        Utils.define_global("headers", callback);
        Utils.define_global("header", callback);
    }
}

export default HttpHelpers;