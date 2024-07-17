const File = require("./File");

class Validator {
    errors = {}
    errors_messages = null;
    isSuccess = true;

    async make(data, validations, messages = null) {

        const result = {};
        this.isSuccess = true;
        for (const key in validations)
            for (const val of validations[key].split('|')) {
                const validation = this.getValidation(data, key, val);
                result[key] = { [val]: validation };
                if (result[key][val] == false) {
                    this.isSuccess = false;
                    if (messages !== null && typeof messages[key] !== 'undefined' && typeof messages[key][val] !== "undefined")
                        this.addErrors(key, messages[key][val])
                    else
                        this.addErrors(key, await this.getErrorsMessages(val, key))
                }
            }

        return this;
    }
    addErrors(key, message) {
        Object.assign(this.errors, { [key]: message })
    }
    getValidation(data, key, validation) {
        const keys = key.split('.');
        let result = null;
        if (keys.length == 1)
            result = Validators[validation]()(data[key] ?? undefined);
        else {
            try {
                let valueValid = null;
                for (const validKey of keys) {
                    if (keys.indexOf(validKey) == keys.length - 1)
                        result = Validators[validation]()(valueValid[validKey] ?? undefined);
                    else {
                        if (valueValid == null)
                            valueValid = data[validKey];
                        else
                            valueValid = valueValid[validKey];
                    }
                }
            } catch {
                result = false;
            }
        }

        return result;
    }
    async getErrorsMessages(column_validation, column_name) {
        if (this.errors_messages == null)
            this.errors_messages = JSON.parse(
                (await File.readerFileData(File.getDirPath('./config/errors.json'))).toString())
            ['validator'][process.env.LANGUAGE]

        return this.errors_messages[column_validation].replace('%s', column_name);
    }


    validations() {
        return [
            "required",
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
                if (number === NaN || typeof number !== 'number')
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

    static boolean() {
        return function (data) {
            return Boolean(data);
        }
    }
}

module.exports = { Validator, Validators };