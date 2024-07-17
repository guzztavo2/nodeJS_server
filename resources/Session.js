
class Session {
    request;
    constructor(request) {
        this.request = request;
    }

    create(key, value) {
        this.request.session[key] = value;
        this.request.session.save(err => {
            if (err)
                console.log(err);
        });
    }

    getByKey(key) {
        return this.request.session[key] ?? null;
    }

    deleteByKey(key) {
        if (this.request.session[key] !== undefined) {
            delete this.request.session[key];
            this.request.session.save();
            return true;
        }
        return false;
    }
    all() {
        return this.request.session ?? false;
    }
}

module.exports = Session;