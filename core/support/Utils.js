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
        return Utils.is_null(data) || Utils.is_blank(data) || !data ? true : false;
    }

    static is_null(data) {
        return data === null || data === undefined;
    }

    static is_blank(data){
        return data.length === 0;
    }

    static is_string(data){
        if(Utils.is_empty(data))
            return false;
        return typeof data === "string" ? true : false;
    }
    
    static is_class(data, instancedOf){
        return data instanceof instancedOf ? true : false;
    }

    static is_array(data){
        return this.is_class(data, Array);
    }
}

export default Utils;