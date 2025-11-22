class Utils {

    static validateString(val, name='value'){
        if (typeof val !== 'string')
            throw new Error(`The ${name} must be a string`);
    }
    
    static validateArray(val, name='value'){
        if (typeof val !== 'object')
            throw new Error(`The ${name} must be a array`);
    }
}

module.exports = Utils;