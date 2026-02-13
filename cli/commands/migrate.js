import MySql from '#core/database/MySql.js';
import Directory from '#core/filesystems/Directory.js';
import Cli from '#core/support/Cli.js';
import Log from '#core/support/Log.js';

class Migrate extends Cli {

    migrationFolderPath = new Directory("migrations", './');
    path = this.migrationFolderPath.getAbsolutePath();
    files = [];
    static mysql = null;

    tables_created = []
    tables_updated = []

    createMigrationTableIfNotExist() {
        return Migrate.mysql.verifyTableExist('migrations').then(res_ => {
            if (!res_)
                return Migrate.mysql.createMigrationTable().then().catch(err => {
                    throw err;
                });
        }).catch(err => {
            throw err;
        });
    }

    createTable(result, migration, callback) {
        let query = {};

        result.forEach(el => {
            const key = el.toSQL().column_name;
            const sql = el.toSQL().sql;
            const object = { [key]: sql };
            query = {
                ...query, ...object
            };
            callback(el);
        });

        return Migrate.mysql.createTable(migration.table_name, query);
    }

    alterTable(result, migration, callback) {
        let query = {};

        result.forEach(el => {
            const key = el.toSQL().column_name;
            const sql = el.toSQL().sql;
            const object = { [key]: sql };
            query = {
                ...query, ...object
            };
            callback(el);

        });
        return Migrate.mysql.alterTable(migration.table_name, query);
    }

    createTableOrUpdate(migration) {

        const constraints = {
            unique: [],
            foreignKey: [],
            check: [],
            index: [],
            before: [],
            after: []
        };

        return Migrate.mysql.verifyTableExist(migration.table_name).then(res => {
            const checkConstraints = (el) => {
                if (el.check_var)
                    constraints.check = constraints.check.concat({ column: el.name, value: (el.check_var) });
                if (el.foreignKey_var)
                    constraints.foreignKey = constraints.foreignKey.concat({ column: el.name, value: (el.foreignKey_var) });
                if (el.unique_var)
                    constraints.unique = constraints.unique.concat({ column: el.name, value: (el.unique_var) });
                if (el.index_var)
                    constraints.index = constraints.index.concat({ column: el.name, value: (el.index_var) });
                if (el.after_var)
                    constraints.after = constraints.after.concat({ column: el.name, value: (el.after_var) });
                if (el.before_var)
                    constraints.before = constraints.before.concat({ column: el.name, value: (el.before_var) });
            }

            if (res == false) {
                this.tables_created.push(migration.table_name)
                return this.createTable(migration.create(), migration, (el) => { checkConstraints(el) }).then(_ => Migrate.mysql.addConstraint(migration.table_name, constraints));
            } else {
                this.tables_updated.push(migration.table_name)
                return this.alterTable(migration.create(), migration, (el) => { checkConstraints(el) }).then(_ => Migrate.mysql.addConstraint(migration.table_name, constraints));
            }
        }).catch(err => {
            Log.error(err);
        });
    }

    beforeHandle() {
        Migrate.mysql = new MySql();
        return this.migrationFolderPath.readDirectory().then(collection => {
            this.files = collection.toArray().sort((a, b) => a.getFileName() < b.getFileName() ? -1 : 1);

            return this.createMigrationTableIfNotExist().then().catch(err => Cli.exitError(err));
        });
    }

    useFiles() {
        const migrated = [];
        return Migrate.mysql.selectAll('migrations').then(res => {
            let names = [];
            if (res.length !== 0)
                names = res.map(val => val.name);

            const executeMySql = (migration, file) => {
                return this.createTableOrUpdate(migration).then(() =>
                    Migrate.mysql.insertValue('migrations', ['name'], [file.getFileName()])
                );
            };

            return this.files.reduce((promiseChain, originalFile) => {
                return promiseChain.then(() => {
                    if (names.includes(originalFile.getFileName())) {
                        return;
                    }

                    return originalFile.importJSFile().then(module => {
                        if (!migrated.includes(originalFile)) {
                            return executeMySql(module, originalFile).then(() => {
                                migrated.push(originalFile);
                            });
                        }
                    });
                });
            }, Promise.resolve()).then(() => migrated);
        }).catch(err => {
            throw err;
        });

    }

    handle() {
        return this.useFiles().then((migrated) => {
            Log.message(`\n\nMigrate as successful.\nCreated tables: 
                ${this.tables_created.join(", ")}\nUpdated tables: ${this.tables_updated.join(", ")} `);
            if (migrated.length > 0) {
                Log.message(`\nList of files migrated:\n${migrated.map(val => val.getRelativePath()).join('\n')}\n`)
            }
        }).catch(err => {
            throw err
        });
    }

    afterHandle() { }
}

new Migrate();