const File = require("./File");

class Validator {
    errors = {};
    errors_messages = null;
    isSuccess = true;

    static make(data, validations, messages = null) {
        return (new Validator()).make(data, validations, messages);
    }
    async make(data, validations, messages = null) {

        const result = {};
        this.isSuccess = true;
        for (const key in validations)
            for (let valid of validations[key].split('|')) {
                let validation;
                if (valid.search('min') !== -1 || valid.search('max') !== -1) {
                    validation = valid.split(':');
                    valid = validation;
                    validation = this.getValidation(data, key, validation[0], validation[1]);
                } else
                    validation = this.getValidation(data, key, valid);

                if (typeof valid == 'object' && typeof valid[1] !== 'undefined') {
                    result[key] = { [valid[0]]: validation };
                    if (result[key][valid[0]] == false) {
                        this.isSuccess = false;
                        if (messages !== null && typeof messages[key] !== 'undefined' && typeof messages[key][valid[0]] !== "undefined")
                            this.addErrors(key, messages[key][valid[0]]);
                        else
                            this.addErrors(key, await this.getErrorsMessages(valid[0], key));
                    }
                }
                else
                    result[key] = { [valid]: validation };
                if (result[key][valid] == false) {
                    this.isSuccess = false;
                    if (messages !== null && typeof messages[key] !== 'undefined' && typeof messages[key][valid] !== "undefined")
                        this.addErrors(key, messages[key][valid]);
                    else
                        this.addErrors(key, await this.getErrorsMessages(valid, key));
                }
            }
        return this;
    }

    addErrors(key, message) {
        Object.assign(this.errors, { [key]: message });
    }

    getValidation(data, key, validation, param = null) {
        const keys = key.split('.');
        let result = null;


        if (keys.length == 1)
            if (param != null) {
                result = Validators[validation](param)(data[key] ?? undefined);
            }
            else
                result = Validators[validation]()(data[key] ?? undefined);
        else
            try {
                let valueValid = null;
                for (const validKey of keys) {
                    if (keys.indexOf(validKey) == keys.length - 1)
                        result = Validators[validation]()(valueValid[validKey] ?? undefined);
                    else
                        if (valueValid == null)
                            valueValid = data[validKey];
                        else
                            valueValid = valueValid[validKey];
                }
            } catch {
                result = false;
            }

        return result;
    }

    async getErrorsMessages(column_validation, column_name, param = null) {
        if (this.errors_messages == null)
            this.errors_messages = JSON.parse(
                (await File.readerFileData(File.getDirPath('./config/errors.json'))).toString())
            ['validator'][process.env.LANGUAGE];

        const errorMessage = this.errors_messages[column_validation].replace('%s', column_name);
        return errorMessage.replace('%c', param);
    }

    validations() {
        return [
            "required",
            "string",
            "number",
            "array",
            "object",
            "boolean",
            "email",
            "min",
            "max"
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
                if (number === NaN || typeof number !== 'number')
                    return false;
                return true;
            } catch {
                return false;
            }
        }
    }

    static float() {
        return function (data) {
            if (typeof data == 'number')
                return Number.parseFloat(data);

            try {
                const number = Number.parseFloat(data);
                if (number === NaN || typeof number !== 'number')
                    throw Error();
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
    static min(minLength) {
        return function (data) {
            if (data.length < minLength)
                return false;

            return true;
        }
    }
    static max(maxLength) {
        return function (data) {
            if (data.length >= maxLength)
                return false;

            return true;
        }
    }

    static boolean() {
        return function (data) {
            return Boolean(data);
        }
    }

    static email() {
        return function (data) {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
            if (!data || data.length > 254)
                return false;

            if (!emailRegex.test(data))
                return false;

            const emailParts = data.split("@");

            if (emailParts[0].length > 64)
                return false;

            const domainParts = emailParts[1].split(".");
            if (domainParts.some(part => part.length > 63))
                return false;

            return true;
        }
    }
}

module.exports = Validator;