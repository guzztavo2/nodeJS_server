const bcrypt = require('bcrypt');

class Encrypt {
    salt_round = 10
    bcrypt;

    constructor() {
        this.bcrypt = bcrypt;
    }
    crypt(value) {
        return new Promise((res) => {
            this.bcrypt.hash(value, this.salt_round).then(response =>
                res(response)
            )
        })
    }
    static crypt_(value) {
        return new Encrypt().crypt(value);
    }

    check(value, value_1) {
        return new Promise((res) => {
            bcrypt.compare(value, value_1, (err, result) => {
                if (err) throw (err);
                res(result);
            });
        })
    }
    static async check_(value, value_1) {
        return await new Encrypt().check(value, value_1);
    }
}

module.exports = Encrypt;