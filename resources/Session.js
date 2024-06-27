
class Session {
    request;
    constructor(request) {
        this.request = request;
    }

    create(key, value) {
        this.request.session[key] = value;
    }

    getByKey(key) {
        return this.request.session[key] ?? null;
    }

    deleteByKey(key) {
        if (this.request.session[key] !== undefined)
            delete this.request.session[key];

    }
    all() {
        return this.request.session;
    }
}

module.exports = Session;