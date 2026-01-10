import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

class Encrypt {
    salt_round = 10
    bcrypt;

    constructor() {
        this.bcrypt = bcrypt;
    }

    crypt(value) {
        return new Promise((resolve, reject) => {
            try {
                this.bcrypt.hash(value, this.salt_round).then(response => resolve(response))
            } catch (e) {
                reject(e);
            }
        })
    }

    static crypt_(value) {
        return new Encrypt().crypt(value);
    }

    check(value, value_1) {
        return new Promise((resolve, reject) => {
            try {
                bcrypt.compare(value, value_1, (err, result) => {
                    if (err) throw (err);
                    resolve(result);
                });
            } catch (e) {
                reject(e);
            }
        })
    }
    static async check_(value, value_1) {
        return await new Encrypt().check(value, value_1);
    }

    static generateString(size = 20) {
        return crypto.randomBytes(size).toString('hex').slice(0, size);
    }
}

export default Encrypt;