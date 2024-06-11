class Request {
    requests = [];

    quantity = 0;
    constructor(requests) {
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