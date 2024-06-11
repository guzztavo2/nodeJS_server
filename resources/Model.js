const Encrypt = require('./Encrypt');

class Model {
    typeModel;

    setTypeModel() {
        if (this.typeModel == undefined)
            this.typeModel = new typeModel(this.table);
    }

    async first() {
        this.setTypeModel();

        return this.defineActualObject((await this.typeModel.limit(1).orderBy('id ASC').get())[0]);
    }
    static async first() {
        return await (new this()).first();
    }

    async all() {
        this.setTypeModel();
        const response = await this.typeModel.get();

        const res = [];

        for (let el of response)
            res.push((Object.create(this)).defineActualObject(el));

        return res;
    }

    static all() {
        return (new this()).all();
    }

    where(where) {
        this.setTypeModel();
        return this.typeModel.where(where);
    }

    select(keys = null) {
        this.setTypeModel();
        return this.typeModel.select(keys);
    }

    async last() {
        this.setTypeModel();
        return await this.typeModel.limit(1).orderBy('id DESC').get();
    }

    static create(object) {
        return new this().create(object);
    }

    async create(object) {
        this.setTypeModel();
        const keys = Object.keys(object);
        const values = await this.verifyTypeOfKeys(object, keys);

        await this.typeModel.connection_database.insertValue(this.table, keys, values);
        let sql = '';

        for (let n = 0; n < values.length; n++) {
            if (this.fillable.includes(keys[n]))
                sql += `${keys[n]} = ${values[n]} AND `
        }

        sql = sql.substring(0, sql.lastIndexOf(' AND '));

        const response = await this.typeModel.connection_database.where(this.table, sql);
        this.defineActualObject(response[0]);

        return this;
    }

    toObject() {
        const keys = this.fillable.concat(this.hidden, Object.keys(this.cast));
        let res = {};
        for (const key of keys) {
            res[key] = this[key] ?? null;
        }
        return res;
    }

    defineActualObject(object) {
        for (const key in object) {
            const value = object[key];
            const keyCast = this.keyIsCast(key);
            if (keyCast !== false) {
                if (keyCast == 'object')
                    this[key] = JSON.parse(object[key])
            } else {
                this[key] = value;
            }
        }
        return this;
    }
    async verifyTypeOfKeys(object, keys) {
        const values = [];
        for (const key of keys) {
            const keyCast = this.keyIsCast(key);
            if (object[key] == null || object[key] == undefined)
                values.push(null);
            else
                if (this.keyIsHidden(key))
                    values.push(await Encrypt.crypt_(object[key]));
                else if (keyCast !== false) {
                    if (keyCast == 'object')
                        values.push(JSON.stringify(object[key]))
                }
                else
                    values.push(object[key]);
        }
        return values;
    }

    keyIsHidden(key) {
        return this.hidden.includes(key);
    }

    keyIsCast(key) {
        const castArray = this.getCastArray();
        if (castArray.keys.includes(key)) {
            return castArray.values[castArray.keys.indexOf(key)];
        }
        return false
    }

    getCastArray() {
        const cast = this.cast ?? null;
        if (cast !== null) {

            const keys = Object.keys(cast);
            const values = Object.values(cast);

            return {
                'keys': keys,
                'values': values
            }
        }
    }
}

class typeModel {

    connection_database;
    table;
    select_var = '';
    where_var = '';
    orderBy_var = '';
    limit_var = '';

    setConnection() {
        this.connection_database = new (require('./MySql'))();
    }

    getAllVars() {
        return this.fillable.concat(this.hidden)
    }
    constructor(table_name) {
        this.table = table_name;
        this.setConnection()
    }

    select(keys) {
        if (keys == null)
            this.select_var = "SELECT " + this.keysToSQL().join(',') + " FROM " + this.table;
        else {
            keys = keys.map((val) => `'${val}'`);

            this.select_var = "SELECT " + keys.join(',') + " FROM " + this.table;
        }
        return this;
    }

    where(where) {
        this.where_var = " WHERE " + where;
        return this;
    }

    orderBy(orderBy) {
        this.orderBy_var = " ORDER BY " + orderBy;
        return this;
    }

    limit(limit, offset = null) {
        if (offset == null)
            this.limit_var = " LIMIT " + limit;
        else
            this.limit_var = " LIMIT " + limit + " OFFSET " + offset;
        return this;
    }

    get() {
        const select = this.select_var == '' ? "SELECT * FROM " + this.table : this.select_var;
        const where = this.where_var == '' ? '' : this.where_var;
        const orderBy = this.orderBy_var == '' ? '' : this.orderBy_var;
        const limit = this.limit_var == '' ? '' : this.limit_var;

        const query = select + where + orderBy + limit + ";";

        return this.connection_database.raw(query);
    }

    keysToSQL() {
        return this.getAllVars().map((val) => `'${val}'`);
    }
}
module.exports = Model;