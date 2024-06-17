const Session = require("./Session");

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

        if (!this.request.session.views)
            this.request.session.views = {
                'before': this.request.url
            }
        else
            this.request.session.views = Object.assign(this.request.session.views, {
                'actual': this.request.url
            })

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