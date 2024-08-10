const Session = require("./Session");
const Validator = require("../resources/Validator");
const Response = require("./Response");
class Request {
    requests = [];

    response;
    request;
    quantity = 0;

    session;
    constructor(request, response = null) {
        this.request = request;

        if (response !== null)
            this.response = response;

        this.session = new Session(request);

        const requests = Object.assign(
            request.body,
            request.params,
            request.query
        );

        Object.keys(requests).forEach(key => {
            const value = requests[key];
            this.requests.push(new RequestType(key, value))
        });

        this.quantity = this.requests.length;
    }

    actualUrl() {
        return this.request.url.indexOf('?') != -1 ? this.request.url.substring(0, this.request.url.indexOf('?')) : this.request.url
    }
    insert(key, value) {
        request = new RequestType(key, value)
        this.quantity = this.requests.push(request);
    }
    getLast() {
        return this.requests[this.quantity - 1];
    }

    getFirst() {
        return this.requests[0];
    }

    getByKey(findByKey) {
        return this.requests.find((requestType) => {
            if (requestType.key === findByKey)
                return requestType;
        })
    }
    all() {
        return this.requests;
    }
    
    session() {
        return this.session;
    }

    requestsToObject() {
        const result = {};
        this.requests.forEach(request => {
            const arrayOf = Object.values(request);
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

class RequestType {
    key;
    value;

    constructor(key, value) {
        this.key = key;
        this.value = value;
    }

    toObject() {
        return {
            [this.key]: this.value
        };
    }
}
module.exports = Request;