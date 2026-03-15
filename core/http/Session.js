import Log from "#core/support/Log.js";
import Request from "#core/http/Request.js";

class Session {
   
    create(key, value) {
        Request.httpRequest.session[key] = value;
        Request.httpRequest.session.save(err => {
            if (err)
                Log.error(err);
        });
    }

    getByKey(key) {
        return Request.httpRequest.session[key] ?? null;
    }

    deleteByKey(key) {
        if (Request.httpRequest.session[key] !== undefined) {
            delete Request.httpRequest.session[key];
            Request.httpRequest.session.save();
            return true;
        }
        return false;
    }
    
    all() {
        return Request.httpRequest.session ?? false;
    }
}

export default Session;