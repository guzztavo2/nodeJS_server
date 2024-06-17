
class Session {
    request;
    sessions;
    constructor(request) {
        this.request = request;

        for (const session of request.session) {
            console.log(session);
        }
        this.sessions = request.session;
    }

    create(key, value) {
        this.request.session[key] = value;
    }

    getByKey(key) {
        return this.request.session[key];
    }
    static getByKey(request, key) {
        return (new Session(request)).getByKey(key);
    }

    static create(request, key, value) {
        return new Session(request).create(key, value);
    }
}

module.exports = Session;