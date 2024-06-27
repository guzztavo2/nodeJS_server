const Session = require("./Session");
const Validator = require("../resources/Validator").Validator;

class Request {
    requests = [];

    request;
    quantity = 0;

    session;
    constructor(request) {
        this.request = request;

        this.session = new Session(request);

        const requests = Object.assign(
            {
                'url': request.url.indexOf('?') != -1 ? request.url.substring(0, request.url.indexOf('?')) : request.url,
            },
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
    getAllRequests() {
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

    validate(validations, messages = null) {
        const data = this.requestsToObject();
        (new Validator).make(data, validations, messages);
    }
}

class RequestType {
    key;
    value;

    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
}
module.exports = Request;