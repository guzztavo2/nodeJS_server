const Encrypt = require('./Encrypt');
const MySql = require('./MySql');
const File = require('./File');
const Collection = require('./Collection');
class Model {
    typeModel;

    setTypeModel() {
        if (this.typeModel == undefined)
            this.typeModel = new typeModel(this);
    }

    async constructModelName(modelName) {
        const files = await File.readFilesFromDirectory(File.getDirPath('./models'));
        if (typeof modelName == 'function')
            modelName = modelName['name'];
        else if (typeof modelName == 'string')
            try {
                modelName = (require(File.getDirPath('./models/' + file)))['name']
            } catch {
                return null;
            }
        else
            throw Error('The value of the modelName variable should be string or function, and is in: ' + typeof modelName);

        let modelResult;
        for (const file of files) {
            const model = require(File.getDirPath('./models/' + file));
            if (model['name'] === modelName) {
                modelResult = new model();
                break;
            }
        }
        if (modelResult)
            return modelResult;
        else return null;
    }

    async hasOne(modelName, foreign_key, local_key) {
        const model = await this.constructModelName(modelName);
        return await model.where(`${foreign_key} = ${this[local_key]}`).first();
    }

    async hasMany(modelName, foreign_key, local_key) {
        const model = await this.constructModelName(modelName);
        return await (await model.where(`${foreign_key} = ${this[local_key]}`)).typeModel.get();
    }

    async belongsTo(modelName, foreign_key, local_key) {
        const model = await this.constructModelName(modelName);
        return await (await model.where(`${foreign_key} = ${this[local_key]}`)).typeModel.get();
    }

    getPropNames(model = null) {
        model = !model ? this : model;
        const modelProps = Object.getOwnPropertyNames(Object.getPrototypeOf(model));
        modelProps.splice(0, 1); //remove constructor;
        return (modelProps.map(val => {
            if (model[val])
                return {
                    "name": val,
                    "action": model[val].toString()
                };
        })).filter(val => val ?? val);
    }
    async getFromModelKeysBelongsToMany(tableExtended, model) {
        const keys = await this.typeModel.connection_database.selectAllKeys(tableExtended);
        const modelProps = this.getPropNames(model);
        let foreingKeysResult;
        for (let value of modelProps) {
            const action = value['action'];
            let resultVar = [];
            keys.map(key => {
                if (action.indexOf(key) != -1)
                    resultVar.push(Object.assign(value, { 'key': key }));
            });

            resultVar = resultVar.filter(val => val ?? val);
            if (!resultVar || resultVar.length <= 0 || resultVar.length > 1)
                continue;

            foreingKeysResult = resultVar[0];
            break;
        }

        let foreingKeysResult_ = await this.typeModel.connection_database.getForeignKeys(tableExtended, foreingKeysResult['key'], model.table);
        if (!foreingKeysResult_ || foreingKeysResult_.length == 0 || foreingKeysResult_.length > 1)
            throw Error(`Não foi possível localizar a ForeignKey de ${model.table}`)
        foreingKeysResult_ = foreingKeysResult_[0];
        return {
            'table': {
                'name': foreingKeysResult_['TABLE_NAME'],
                'column': foreingKeysResult_['COLUMN_NAME']
            },
            'referenced_table': {
                'name': foreingKeysResult_['REFERENCED_TABLE_NAME'],
                'column': foreingKeysResult_['REFERENCED_COLUMN_NAME']
            },
            'function': { 'name': foreingKeysResult['name'] }
        };
    }
    async belongsToMany(modelName, extendedModelOrTableName, foreign_key, local_key) {
        const model = await this.constructModelName(modelName);
        let modelExtended = (await this.constructModelName(extendedModelOrTableName));
        modelExtended = !modelExtended || modelExtended === null ? extendedModelOrTableName : modelExtended.table;
        this.setTypeModel();

        const foreignKey = await this.getFromModelKeysBelongsToMany(extendedModelOrTableName, model);
        const response =
            await (this.typeModel.connection_database.raw(
                `SELECT * FROM ${modelExtended} WHERE ${foreign_key} = ${this[local_key]};`)
            );
        const listData_ = await (this.select().where(`${local_key} in(${(response.map(val => val[foreign_key])).join(',')})`).get())
        const listData__ = await (model.select().where(`${foreignKey['referenced_table']['column']} in(${(response.map(val => val[foreignKey['table']['column']])).join(',')})`)).get()

        if (listData_.length == 1)
            this.defineActualObject(listData_[0].thisResponseToObject());
        else
            this['response'][foreignKey['function']['name']] = listData_

        const thisKeys = await this.getFromModelKeysBelongsToMany(extendedModelOrTableName, this);
        this['response'][thisKeys['function']['name']] = listData__;
        return this;
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
        return response.map(val => {
            const data_ = new this.constructor();
            return data_.defineActualObject(val);
        });
    }

    static all() {
        return (new this()).all();
    }

    where(where) {
        this.setTypeModel();
        this.typeModel.where(where);
        return this;
    }
    async get() {
        this.setTypeModel();
        let data = await this.typeModel.get();
        return data.map(val => {
            const data_ = new this.constructor();
            return data_.defineActualObject(val);
        });
    }

    select(keys = null) {
        this.setTypeModel();
        this.typeModel.select(keys);
        return this;
    }

    async last() {
        this.setTypeModel();
        const modelData = await this.typeModel.limit(1).orderBy('id DESC').get();
        for (const data in modelData)
            this[data] = modelData[data];

        return this;
    }
    async first() {

        this.setTypeModel();
        const modelData = (await this.typeModel.limit(1).get())[0];
        if (!modelData)
            return null;
        Object.entries(modelData).map(data => {
            const [key, value] = [data[0], data[1]];
            this[key] = value;
        });
        return this;

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
    thisResponseToObject() {
        return this.response[this.constructor.name] == undefined ? undefined : this.response[this.constructor.name];
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
            this['response'] = {};
            this['response'][this.constructor.name] = {};
            if (keyCast !== false) {
                if (keyCast == 'object')
                    this['response'][this.constructor.name][key] = JSON.parse(object[key]);
            } else
                this['response'][this.constructor.name][key] = value;

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

        if (castArray && castArray.keys.includes(key))
            return castArray.values[castArray.keys.indexOf(key)];

        return false;
    }

    getCastArray() {
        const cast = this.cast ?? null;
        if (cast !== null) {
            const keys = Object.keys(cast);
            const values = Object.values(cast);

            return {
                'keys': keys,
                'values': values
            };
        }
        return null;
    }
}

class typeModel {

    constructor(object) {
        if (process.env.DB_TYPE === 'MySql')
            return new typeModelMySql(object);
    }

}

class typeModelMySql {
    connection_database;
    table;
    select_var = "";
    where_var = "";
    orderBy_var = "";
    limit_var = "";
    innerJoin_var = "";
    object;
    setConnection() {
        this.connection_database = new MySql();
    }

    getAllVars() {
        const result = this.object['fillable'];
        if (this.hidden)
            result.concat(this.hidden);
        return result;
    }
    constructor(object) {
        this.table = object['table'];
        this.object = object;
        this.setConnection()
    }

    select(keys = null) {
        if (keys == null) {
            this.select_var = "SELECT " + this.keysToSQL().join(',') + " FROM " + this.table;
            return this;
        }
        keys = keys.map((val) => `'${val}'`);
        this.select_var = "SELECT " + keys.join(',') + " FROM " + this.table;

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

    innerJoin(table_name, foreignKey, localkey) {
        this.innerJoin_var += ` INNER JOIN ${table_name} ON ${table_name}.${foreignKey}=${this.table}.${localkey} `;
        return this;
    }

    async get() {
        const select = this.select_var == '' ? "SELECT * FROM " + this.table : this.select_var;
        const where = this.where_var == '' ? '' : this.where_var;
        const orderBy = this.orderBy_var == '' ? '' : this.orderBy_var;
        const limit = this.limit_var == '' ? '' : this.limit_var;
        const innerJoin = this.innerJoin_var == '' ? '' : this.innerJoin_var;
        const query = select + innerJoin + where + orderBy + limit + ";";
        this.resetObjectValues();

        const resultQuery = await this.connection_database.raw(query);
        return Collection.createFromArrayObjects(resultQuery);

    }

    async first() {
        const select = this.select_var == '' ? "SELECT * FROM " + this.table : this.select_var;
        const where = this.where_var == '' ? '' : this.where_var;
        const orderBy = this.orderBy_var == '' ? '' : this.orderBy_var;
        const limit = ' LIMIT 1';

        this.resetObjectValues();
        const query = select + where + orderBy + limit + ";";

        return ((await this.connection_database.raw(query))[0]);
    }
    async getKeys(table_name) {
        return await this.connection_database.selectAllKeys(table_name);
    }
    keysToSQL() {
        return this.getAllVars();
    }

    resetObjectValues() {
        this.select_var = '';
        this.where_var = '';
        this.orderBy_var = '';
        this.limit_var = '';
        this.innerJoin_var = '';
    }
}
module.exports = Model;