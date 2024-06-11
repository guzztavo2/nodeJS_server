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
            "object"
        ]
    }
}

module.exports = Validator;