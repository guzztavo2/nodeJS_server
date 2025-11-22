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
        if (data === null || data === undefined || data.length === 0)
            return true;
        return false;
    }
}

module.exports = Utils;