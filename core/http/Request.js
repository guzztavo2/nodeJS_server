import Session from "#core/http/Session.js";
import Validator from "#core/support/Validator.js";
import Response from "#core/http/Response.js";
import Collection from "#core/support/Collection.js";

class Request {
    response;
    static session;
    static httpRequest;
    initPromise;

    constructor(httpRequest = null) {
        Request.setHttpRequest(httpRequest);

        this.session = new Session(Request.httpRequest);

        this.requests = new Collection(Object.assign(
            Request.httpRequest.body || {},
            Request.httpRequest.params || {},
            Request.httpRequest.query || {}
        ));
    }

    static setHttpRequest(httpRequest = false) {
        if (httpRequest && !Response.httpRequest) {
            Request.httpRequest = httpRequest;
            Response.httpResponse = httpRequest.res;
        }
    }

    httpRequest() {
        return Request.httpRequest;
    }

    httpResponse() {
        return Response.httpResponse;
    }

    actualUrl() {
        return Request.httpRequest.url.indexOf('?') != -1 ? Request.httpRequest.url.substring(0, Request.httpRequest.url.indexOf('?')) : Request.httpRequest.url
    }

    insert(key, value) {
        this.requests.add(value, key);
    }

    getLast() {
        return this.requests.last();
    }

    getFirst() {
        return this.requests.first();
    }

    getByKey(findByKey) {
        return this.requests.get(findByKey);
    }

    all() {
        return this.requests.toArray();
    }

    session() {
        return this.session;
    }

    requestsToObject() {
        const result = {};
        this.requests.forEach(httpRequest => {
            const arrayOf = Object.values(httpRequest);
            result[arrayOf[0]] = arrayOf[1];
        })
        return result;
    }

    async validate(validations, messages = null) {
        const data = this.requestsToObject()
        const result = await ((new Validator).make(data, validations, messages));
        const response = new Response(this.session);

        const backAction = response.back({ 'errors': result.errors });
        if (result.isSuccess == false)
            if (backAction)
                backAction.renderResponse(this.response);
            else
                response.json({ 'errors': result.errors }, 200).renderResponse(this.response);

        return result;
    }
}
export default Request;