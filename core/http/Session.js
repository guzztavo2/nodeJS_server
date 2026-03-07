import Log from "#core/support/Log.js";
import Request from "#core/http/Request.js";

class Session {
    httpRequest;
    constructor(httpRequest = null) {
        this.httpRequest = httpRequest || Request.httpRequest;
    }

    create(key, value) {
        this.httpRequest.session[key] = value;
        this.httpRequest.session.save(err => {
            if (err)
                Log.error(err);
        });
    }

    getByKey(key) {
        return this.httpRequest.session[key] ?? null;
    }

    deleteByKey(key) {
        if (this.httpRequest.session[key] !== undefined) {
            delete this.httpRequest.session[key];
            this.httpRequest.session.save();
            return true;
        }
        return false;
    }
    
    all() {
        return this.httpRequest.session ?? false;
    }
}

export default Session;