import mysql from 'mysql';
import Env from '../support/Env.js'
class MySql {
    connection; host; user; password; database; port;

    constructor() {
        this.host = process.env.DB_HOST ?? null;
        this.user = process.env.DB_USERNAME ?? null;
        this.password = process.env.DB_PASSWORD ?? null;
        this.database = process.env.DB_NAME ?? null;
        this.port = process.env.DB_PORT ?? null;

        if (this.database == null)
            this.connection = mysql.createConnection({
                host: this.host,
                user: this.user,
                password: this.password,
                port: this.port ?? undefined
            });
        else
            this.connection = mysql.createConnection({
                host: this.host,
                user: this.user,
                password: this.password,
                database: this.database,
                port: this.port ?? undefined
            });
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
        else
            this.connection = mysql.createConnection({
                host: host,
                user: user,
                password: password,
                database: database,
            });
    }

    createDatabase(database_name) {
        return this.verifyConnection().then(() => new Promise((res, error_) => {
            this.connection.query("")
            this.connection.query("CREATE DATABASE " + database_name, function (err, result) {
                if (err) error_(err);
                else res(result);
            });
        }));
    }

    checkDatabaseExists() {
        return new Promise((res, rej) => {
            this.connection.query(`SHOW DATABASES LIKE '${this.database}'`, (err, result) => {
                if (err) rej(err);
                else res(result);
            })
        })
    }
    useOtherDatabase(database_name) {
        return new MySql(this.host, this.user, this.password, database_name);
    }

    verifyConnection() {
        if (!this.connection) {
            return Promise.reject(new Error("No connection object"));
        }

        return new Promise((resolve, reject) => {
            // se ainda não conectou, conecta uma vez
            if (!this.connection._connectCalled) {
                this.connection.connect(err => {
                    if (err) return reject(err);

                    // testa a conexão
                    this.connection.query('SELECT 1', (err) => {
                        if (err) return reject(err);
                        resolve(true);
                    });
                });
            } else {
                // já conectado, só testa
                this.connection.query('SELECT 1', (err) => {
                    if (err) {
                        // se falhou, tenta reconectar
                        this.connection.connect(connectErr => {
                            if (connectErr) return reject(connectErr);
                            resolve(true);
                        });
                    } else {
                        resolve(true);
                    }
                });
            }
        });
    }


    createTable(table_name, names_types) {
        return this.verifyConnection().then(() => {
            let sql = "CREATE TABLE " + table_name + " (";

            let keys = Object.keys(names_types);
            keys.forEach((val) => {
                const isLast = keys.indexOf(val) == (keys.length - 1) ? true : false;
                if (isLast)
                    sql += val + " " + names_types[val];
                else
                    sql += val + " " + names_types[val] + ", ";
            })

            sql += ")";

            return new Promise((res, error) => {
                return this.connection.query(sql, (err, result) => {
                    if (err) return error(err);
                    return res(result);
                });
            });
        }).catch(err => {
            throw err;
        });
    }

    alterTable(table_name, names_types) {
        return this.verifyConnection().then(new Promise(async (resolve, reject) => {
            var sql = "ALTER TABLE " + table_name;
            return this.selectAllKeys(table_name).then((existKeys) => {
                Object.keys(names_types).forEach((val) => {
                    const keyExist = existKeys.includes(val);
                    sql += (keyExist ? " MODIFY COLUMN " : " ADD ") + val + " " + names_types[val] + ",";
                });
                if (sql) {
                    sql = sql.substring(0, sql.lastIndexOf(',')) + ";";
                    this.connection.query(sql, (err, result) => {
                        if (err)
                            reject(err);
                        resolve(result);
                    });
                }
            });
        }));
    }

    insertValue(table, keys, values) {
        values.forEach((value, key) => {
            if (value == null)
                values[key] = "NULL"
            else
                values[key] = "'" + value + "'"
        });
        return this.verifyConnection().then(() => new Promise((res, reject) => {
            let sql = "INSERT INTO " + table + " (" + keys.join(",") + ") VALUES (" + values.join(",") + ")";
            this.connection.query(sql, function (err, result) {
                if (err) reject(err);
                res(result);
            });
        }));
    }

    selectAll(table, keys = null) {
        return this.verifyConnection().then(() => new Promise((resolve, reject) => {
            const query = keys == null ? `SELECT * FROM ${table};` : `SELECT ${keys.join(",")} FROM ${table};`;
            this.connection.query(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        })).catch(err => {
            throw err;
        });
    }


    selectAllKeys(table, keys = null) {
        this.verifyConnection();

        return new Promise((res, error) => {
            if (keys == null)
                this.connection.query("SELECT * FROM " + table, (err, result, fields) => {
                    if (err) error(err);
                    if (!fields)
                        return [];
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
        return new Promise((resolve, reject) =>
            this.verifyConnection().then(() => {
                this.connection.query(`SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}';`, (err, result, fields) => {
                    if (err) return reject(err);
                    resolve(result[0]['COLUMN_TYPE']);
                });
            }));
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

    getForeignKeys(table = null, column = null, referenced_table_name = null, referenced_column_name = null) {
        this.verifyConnection();

        let sql = `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE`;

        let keys = {
            table: table ?? null,
            column: column ?? null,
            referenced_table_name: referenced_table_name ?? null,
            referenced_column_name: referenced_column_name ?? null
        };

        let nowSql = false;
        for (const [key, value] of Object.entries(keys)) {
            if (value == null)
                continue;
            switch (key) {
                case 'table':
                    if (!nowSql) {
                        sql += ` WHERE `
                        nowSql = true;
                    }
                    else
                        sql += ' AND '
                    sql += `TABLE_NAME = '${value}'`
                    break;
                case 'column':
                    if (!nowSql) {
                        sql += ` WHERE `
                        nowSql = true;
                    }
                    else
                        sql += ' AND '
                    sql += `COLUMN_NAME = '${value}'`;
                    break;
                case 'referenced_table_name':
                    if (!nowSql) {
                        sql += ` WHERE `
                        nowSql = true;
                    }
                    else
                        sql += ' AND '
                    sql += `REFERENCED_TABLE_NAME = '${value}'`;
                    break;
                case 'referenced_column_name':
                    if (!nowSql) {
                        sql += ` WHERE `
                        nowSql = true;
                    }
                    else
                        sql += ' AND '
                    sql += `REFERENCED_COLUMN_NAME = '${value}'`;
                    break;
            }
        }
        sql += ';'
        return new Promise((res, error) => {
            this.connection.query(sql, (err, result, fields) => {
                if (err) error(err);
                res(result);
            });
        });
    }

    getPositions(table) {
        return this.verifyConnection().then(new Promise((res, error) => {
            this.connection.query(`SELECT COLUMN_NAME, ORDINAL_POSITION	FROM INFORMATION_SCHEMA.COLUMNS	WHERE TABLE_NAME = '${table}' AND TABLE_SCHEMA != 'mysql';`, (err, result, fields) => {
                if (err) error(err);
                res(result)
            });
        }));
    }

    addConstraint(table_name, constraints) {
        const keys = Object.keys(constraints);

        const promises = [];
        for (const key in constraints) {
            const props = constraints[key];
            if (!props || !props.length || key === "index") continue;

            const columns = props.map(obj => obj.column);
            const constraint_name = table_name + columns.join(',').replaceAll(',', '') + Math.floor(Math.random() * 100);

            const tasks = props.map(prop => {

                if (key === 'before') {
                    return this.getColumnType(table_name, prop.column).then(res => {
                        return this.getPositions(table_name).then(values => {
                            let result = values.filter(value => value['COLUMN_NAME'] == prop.value);

                            if (result[0]['ORDINAL_POSITION'] == 1)
                                return ` MODIFY ${prop.column} ${res} FIRST`;

                            else {
                                result = values.filter(value => value['ORDINAL_POSITION'] == (result[0]['ORDINAL_POSITION'] - 1))
                                return ` MODIFY ${prop.column} ${res} AFTER ${result[0]['COLUMN_NAME']}`
                            }
                        });
                    });
                } else if (key === 'after') {
                    return this.getColumnType(table_name, prop.column).then(res => {
                        return ` MODIFY ${prop.column} ${res} AFTER ${prop.value}`
                    });
                }
                else if (key === 'unique') {
                    return Promise.resolve(" ADD CONSTRAINT " + constraint_name + ` UNIQUE(${columns.join(',')}), `);
                }
                else if (key === 'foreignKey') {
                    let sql;
                    props.map((prop) => {
                        sql += ` ADD FOREIGN KEY (${prop.column}) REFERENCES ${prop.value.from}(${prop.value.references}),`;
                    })
                    return Promise.resolve(sql);
                }
                else if (key === 'check') {
                    let aux = '';
                    props.map((prop) => {
                        if (aux == '')
                            aux += ` (${prop.column} ${prop.value} `;
                        else
                            aux += `AND ${prop.column} ${prop.value}`;
                    })
                    aux += "),";
                    return Promise.resolve(`ADD CONSTRAINT ${constraint_name} CHECK` + aux);
                }
            });
            if (tasks.length)
                promises.push(Promise.all(tasks));
        }


        return Promise.all(promises).then(result => {
            let sql = result.flat().join(" ");
            if (sql) {
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
        });
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
        return this.verifyConnection().then(() => {
            let sql = `SHOW TABLES LIKE "${table_name}"`;
            return new Promise((resolve, reject) => {
                this.connection.query(sql, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(result.length == 0 ? false : true);
                });
            });
        });
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
        return new Promise((res, reject) => {
            this.connection.query(query, (err, result) => {
                if (err)
                    reject(err);

                res(result);
            })
        })
    }

    createMigrationTable() {
        return this.createTable("migrations", {
            "id": "bigint unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT",
            "name": "varchar(255) NOT NULL"
        }).then(() => true).catch((err) => {
            throw Error(`Not possible create Migration table in database ${this.database}`);
        });
    }

}
export default MySql;