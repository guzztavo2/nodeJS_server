
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

    all(){
        return this.request.session;
    }
}

module.exports = Session;