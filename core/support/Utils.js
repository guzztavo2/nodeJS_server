class Utils {

    static validateString(val, name = 'value') {
        if (!Utils.isString(val))
            throw new Error(`The ${name} must be a string`);
    }

    static validateArray(val, name = 'value') {
        if (typeof val !== 'object')
            throw new Error(`The ${name} must be a array`);
    }

    static filterEmptyArray(arr){
        const newArr = [];
        for(const key in arr){
            if(!Utils.isEmpty(arr[key]))
                if(arr[key] instanceof Array)
                    newArr.push(Utils.filterEmptyArray(arr[key]));
                else
                    newArr.push(arr[key]);
        }
        return newArr;
    }

    static isEmpty(data) {
        return Utils.isNull(data) || Utils.isBlank(data) || !data ? true : false;
    }

    static isNull(data) {
        return data === null || data === undefined;
    }

    static isBlank(data){
        if(Utils.isNull(data))
            return true;
        
        if(typeof data === "string") return data.trim().length === 0;

        if(this.isArray(data)) return data.length === 0;

        if (typeof data === "object") return Object.keys(data).length === 0;

        return false;
    }

    static isString(data){
        if(Utils.isEmpty(data))
            return false;
        return typeof data === "string" || data instanceof String ? true : false;
    }
    
    static isClass(data, instancedOf){
        if(instancedOf === Array)
            return Array.isArray(data);

        if(typeof instancedOf === "object" && !Array.isArray(data))
            return data instanceof instancedOf;
        else
            return typeof data === instancedOf;
    }

    static isArray(data){
        return this.isClass(data, Array);
    }

    static defineGlobal(name, callback){
        global[name] = callback;
    }
}

export default Utils;