import Utils from "#core/support/Utils.js";

class ApplicationHelpers{
    
    static handle(){
        Utils.define_global("DEFINE", (name, callback) => Utils.define_global(name, callback));
        DEFINE("empty", (data) => Utils.is_empty(data));
    }
}

export default ApplicationHelpers;