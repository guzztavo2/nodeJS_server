const mysql = require('mysql');
class MySql {
    connection; host; user; password; database;

    ID_SQL_TYPES = {
        "0": "DECIMAL",
        "1": "TINYINT",
        "2": "SMALLINT",
        "3": "INT",
        "4": "FLOAT",
        "5": "DOUBLE",
        "6": "NULL",
        "7": "TIMESTAMP",
        "8": "BIGINT",
        "9": "MEDIUMINT",
        "10": "DATE",
        "11": "TIME",
        "12": "DATETIME",
        "13": "YEAR",
        "14": "DATE",
        "15": "VARCHAR",
        "16": "BIT",
        "245": "JSON",
        "246": "DECIMAL(25,5)",
        "247": "ENUM",
        "248": "SET",
        "249": "TINYBLOB",
        "250": "MEDIUMBLOB",
        "251": "LONGBLOB",
        "252": "BLOB",
        "253": "VARCHAR",
        "254": "VARCHAR",
        "255": "GEOMETRY"
    }

    constructor() {

        if (process.env.DB_TYPE === 'MySql') {

            this.host = process.env.DB_HOST ?? null;
            this.user = process.env.DB_USERNAME ?? null;
            this.password = process.env.DB_PASSWORD ?? null;
            this.database = process.env.DB_NAME ?? null;

            if (this.database == null)
                this.connection = mysql.createConnection({
                    host: this.host,
                    user: this.user,
                    password: this.password,
                });
            else {
                this.connection = mysql.createConnection({
                    host: this.host,
                    user: this.user,
                    password: this.password,
                    database: this.database,
                });
            }
        }
    }
    otherConnection(host, user, password, database = null) {
        this.host = host;
        this.user = user;
        this.password = password;
        this.database = database;

        if (database == null)
            this.connection = mysql.createConnection({
                host: host,
                user: user,
                password: password,
            });
        else {
            this.connection = mysql.createConnection({
                host: host,
                user: user,
                password: password,
                database: database,
            });
        }
    }
    createDatabase(database_name) {
        this.verifyConnection();

        this.connection.query("CREATE DATABASE " + database_name, function (err, result) {
            if (err) throw err;
        });
    }
    useOtherDatabase(database_name) {
        return new MySql(this.host, this.user, this.password, database_name);
    }
    verifyConnection() {
        if (!this.connection._connectCalled)
            this.connection.connect((err) => {
                if (err) throw err;
            });
    }
    createTable(table_name, names_types) {
        this.verifyConnection();

        var sql = "CREATE TABLE " + table_name + " (";

        var keys = Object.keys(names_types);
        keys.forEach((val) => {
            const isLast = keys.indexOf(val) == (keys.length - 1) ? true : false;
            if (isLast)
                sql += val + " " + names_types[val];
            else
                sql += val + " " + names_types[val] + ", ";
        })

        sql += ")";

        return new Promise((res, error) => {
            this.connection.query(sql, (err, result) => {
                if (err) error(err);
                res(result);
            });
        })
    }

    alterTable(table_name, names_types) {
        this.verifyConnection();
        return new Promise(async (res, error) => {
            var sql = "ALTER TABLE " + table_name;
            const existKeys = await this.selectAllKeys(table_name);
            var keys = Object.keys(names_types);
            keys.forEach((val) => {
                const keyExist = existKeys.includes(val);

                if (keyExist) {
                    sql += " MODIFY COLUMN " + val + " " + names_types[val] + ",";
                } else {
                    sql += " ADD " + val + " " + names_types[val] + ",";;
                }

            })
            sql = sql.substring(0, sql.lastIndexOf(',')) + ";";
            this.connection.query(sql, (err, result) => {
                if (err)
                    error(err);
                res(result);
            });
        })
    }

    insertValue(table, keys, values) {
        values.forEach((value, key) => {
            if (value == null)
                values[key] = "NULL"
            else
                values[key] = "'" + value + "'"
        });
        this.verifyConnection();

        let sql = "INSERT INTO " + table + " (" + keys.join(",") + ") VALUES (" + values.join(",") + ")";

        return new Promise((res) => {
            this.connection.query(sql, function (err, result) {
                if (err) throw err;
                res(result);
            });
        })

    }

    selectAll(table, keys = null) {
        this.verifyConnection();

        return new Promise((res, error) => {
            if (keys == null)
                this.connection.query("SELECT * FROM " + table, (err, result, fields) => {
                    if (err) error(err);
                    res(result);
                });
            else
                this.connection.query("SELECT " + keys.join(",") + " FROM " + table, (err, result, fields) => {
                    if (err) error(err);
                    return res(result);
                });
        });
    }
    selectAllKeys(table, keys = null) {
        this.verifyConnection();

        return new Promise((res, error) => {
            if (keys == null)
                this.connection.query("SELECT * FROM " + table, (err, result, fields) => {
                    if (err) error(err);
                    res(fields.map((value) => value.name));
                });
            else
                this.connection.query("SELECT " + keys.join(",") + " FROM " + table, (err, result, fields) => {
                    if (err) error(err);
                    res(fields.map((value) => value.name));
                });
        });
    }

    getColumnType(table, column) {
        this.verifyConnection();

        return new Promise((res, error) => {
            this.connection.query(`SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}';`, (err, result, fields) => {
                if (err) error(err);
                res(result[0]['COLUMN_TYPE']);
            });
        });
    }
    getPosition(table, column) {
        this.verifyConnection();

        return new Promise((res, error) => {
            this.connection.query(`SELECT ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}';`, (err, result, fields) => {
                if (err) error(err);
                res(result[0]['ORDINAL_POSITION']);
            });
        });
    }
    getPositions(table) {
        this.verifyConnection();

        return new Promise((res, error) => {
            this.connection.query(`SELECT COLUMN_NAME, ORDINAL_POSITION	FROM INFORMATION_SCHEMA.COLUMNS	WHERE TABLE_NAME = '${table}' AND TABLE_SCHEMA != 'mysql';`, (err, result, fields) => {
                if (err) error(err);
                res(result)
            });
        });
    }


    async addConstraint(table_name, constraints) {

        const keys = Object.keys(constraints);
        let sql = '';
        for (const key of keys) {
            const props = constraints[key];
            if (props.length !== 0) {
                const columns = props.map(obj => obj.column);
                const constraint_name = table_name + columns.join(',').replaceAll(',', '') + Math.floor(Math.random() * 100);

                switch (key) {
                    case 'before':

                        await this.getColumnType(table_name, props[0].column).then(async res => {
                            const values = await this.getPositions(table_name);

                            let result = values.filter(value => value['COLUMN_NAME'] == props[0].value);
                            
                            if (result[0]['ORDINAL_POSITION'] == 1)
                                sql += ` MODIFY ${props[0].column} ${res} FIRST`;

                            else {
                                result = values.filter(value => value['ORDINAL_POSITION'] == (result[0]['ORDINAL_POSITION'] - 1))

                                sql += ` MODIFY ${props[0].column} ${res} AFTER ${result[0]['COLUMN_NAME']}`
                            }
                        })

                        break;

                    case 'after':
                        await this.getColumnType(table_name, props[0].column).then(res => {
                            sql += ` MODIFY ${props[0].column} ${res} AFTER ${props[0].value}`
                        })

                        break;
                    case 'unique':
                        sql += " ADD CONSTRAINT " + constraint_name + ` UNIQUE(${columns.join(',')}), `;
                        break;

                    case 'foreignKey':
                        props.map((prop) => {
                            sql += ` ADD FOREIGN KEY (${prop.column}) REFERENCES ${prop.value.references}(${prop.value.from}),`;
                        })
                        break;

                    case 'check':
                        let aux = '';
                        props.map((prop) => {
                            if (aux == '')
                                aux += ` (${prop.column} ${prop.value} `;
                            else
                                aux += `AND ${prop.column} ${prop.value}`;
                        })
                        aux += "),";
                        sql += `ADD CONSTRAINT ${constraint_name} CHECK` + aux;
                        break;
                }
            }
        }

        if (sql.length > 0) {
            const aux = sql.substring(0, sql.lastIndexOf(','));
            if (aux.length > 0)
                sql = aux + ';'
            else {
                sql += ';';
            }
            this.connection.query("ALTER TABLE " + table_name + sql, (err, result) => {
                if (err)
                    throw err;
            });
        }

        sql = '';

        if (constraints.index.length > 0) {
            const columns = constraints.index.map(obj => obj.column);
            const constraint_name = table_name + columns.join(',').replaceAll(',', '') + Math.floor(Math.random() * 100);

            sql += `CREATE INDEX ${constraint_name} ON ${table_name} (${columns});`;
        }

        if (sql.length > 0) {
            this.connection.query(sql, (err, result) => {
                if (err)
                    throw err;
            });
        }
    }
    deleteFromTable(table_name, keys, values) {
        values.forEach((value, key) => {
            values[key] = "'" + value + "'"
        });

        let sqlValue = '';

        for (let n = 0; n < keys.length; n++) {
            if (n == 0) {
                sqlValue += keys[n] + " = " + values[n];
                continue;
            }
            sqlValue += " AND " + keys[n] + " = " + values[n];
        }
        this.verifyConnection();

        var sql = "DELETE FROM " + table_name + " WHERE " + sqlValue;
        this.connection.query(sql, (err, result) => {
            if (err) throw err;
        });

    }

    verifyTableExist(table_name) {
        try {
            let sql = `SHOW TABLES LIKE "${table_name}"`;
            return new Promise((resolve, reject) => {
                this.connection.query(sql, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(result.length == 0 ? false : true);
                });
            });
        } catch (err) {
            console.log(err);
        }
    }

    where(table_name, where) {
        this.verifyConnection();

        return new Promise((res, error) => {
            this.connection.query("SELECT * FROM " + table_name + " WHERE " + where, (err, result, fields) => {
                if (err) error(err);
                res(result);
            });
        });
    }
    raw(query) {
        return new Promise((res) => {
            this.connection.query(query, (err, result) => {
                if (err)
                    throw err;

                res(result);
            })
        })
    }

    async createMigrationTable() {
        return await this.createTable("migrations", {
            "id": "bigint unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT",
            "name": "varchar(255) NOT NULL"
        }).then().catch(err => { throw Error(err) });
    }


}
module.exports = MySql;