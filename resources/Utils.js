class Utils {

    static validateString(val, name = 'value') {
        if (typeof val !== 'string')
            throw new Error(`The ${name} must be a string`);
    }

    static validateArray(val, name = 'value') {
        if (typeof val !== 'object')
            throw new Error(`The ${name} must be a array`);
    }

    static is_empty(data) {
        return data === null || data === undefined || data.length === 0 || !data ? true : false;
    }

    static is_string(data){
        if(Utils.is_empty(data))
            return false;
        return typeof data === "string" ? true : false;
    }
    
    static is_class(data, instancedOf){
        if(Utils.is_empty(data))
            return false;
        return data instanceof instancedOf ? true : false;
    }
}

export default Utils;