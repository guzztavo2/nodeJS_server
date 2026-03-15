class Utils {

    static validateString(val, name = 'value') {
        if (!Utils.is_string(val))
            throw new Error(`The ${name} must be a string`);
    }

    static validateArray(val, name = 'value') {
        if (typeof val !== 'object')
            throw new Error(`The ${name} must be a array`);
    }

    static filter_empty_array(arr){
        const newArr = [];
        for(const key in arr){
            if(!Utils.is_empty(arr[key]))
                if(arr[key] instanceof Array)
                    newArr.push(Utils.filter_empty_array(arr[key]));
                else
                    newArr.push(arr[key]);
        }
        return newArr;
    }

    static is_empty(data) {
        return Utils.is_null(data) || Utils.is_blank(data) || !data ? true : false;
    }

    static is_null(data) {
        return data === null || data === undefined;
    }

    static is_blank(data){
        if(Utils.is_null(data))
            return true;
        
        if(typeof data === "string") return data.trim().length === 0;

        if(this.is_array(data)) return data.length === 0;

        if (typeof data === "object") return Object.keys(data).length === 0;

        return false;
    }

    static is_string(data){
        if(Utils.is_empty(data))
            return false;
        return typeof data === "string" || data instanceof String ? true : false;
    }
    
    static is_class(data, instancedOf){
        if(instancedOf === Array)
            return Array.isArray(data);

        if(typeof instancedOf === "object" && !Array.isArray(data))
            return data instanceof instancedOf;
        else
            return typeof data === instancedOf;
    }

    static is_array(data){
        return this.is_class(data, Array);
    }

    static define_global(name, callback){
        global[name] = callback;
    }
}

export default Utils;