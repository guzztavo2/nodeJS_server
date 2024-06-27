class Validator {

    make(data, validations, messages = null) {
        const keys = Object.keys(data);

        keys.forEach(val => {
            var validation = validations[val];

            if (validation !== undefined) {

                validation = validation.split('|')

                validation.forEach(valid => {
                    this.validate(data[val], valid, messages[val + "." + valid] !== undefined ? messages[val + "." + valid] : null)
                })
            }
        })

    }

    validate(data, validate, message = null) {

    }

    validations() {
        return [
            "string",
            "number",
            "array",
            "object",
            "boolean"
        ]
    }
}

class Validators {

    static required() {
        return function (data) {
            if (!data || data == null || typeof data == 'undefined' || data == undefined)
                return false;
            return true;
        };
    }

    static string() {
        return function (data) {
            if (typeof data == 'string' || data == '')
                return data;
            try {
                return String(data);
            } catch {
                return false;
            }
        }
    }

    static int() {
        return function (data) {
            if (typeof data == 'number')
                return data;

            try {
                const number = Number.parseInt(data);
                if (number === NaN)
                    throw Error('');
                return true;
            } catch {
                return false;
            }
        }
    }

    static float() {
        return function (data) {
            if (typeof data == 'number')
                return data;

            try {
                const number = Number.parseFloat(data);
                if (number === NaN)
                    throw Error('');
                return true;
            } catch {
                return false;
            }
        }
    }

    static array() {
        return function (data) {
            if (typeof data !== 'object')
                return false;
            const response = [];
            for (const number in result)
                response.append(number, result[number]);

            return response;
        }
    }

    static object() {
        return function (data) {
            if (typeof data !== 'object')
                return false;

            const response = {};
            for (const number in result)
                response[number] = result[number];

            return response;
        }
    }

    static boolean() {
        return function (data) {
            return Boolean(data);
        }
    }
}

module.exports = { Validator, Validators };