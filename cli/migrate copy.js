import MySql from '../resources/MySql.js';
import Directory from '../resources/Directory.js';
import Cli from '../resources/Cli.js';

class Migrate extends Cli {

    migrationFolderPath = new Directory("migrations", './');
    path = this.migrationFolderPath.getAbsolutePath();
    files = [];
    static mysql = null;

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

        let constraints = {
            unique: [],
            foreignKey: [],
            check: [],
            index: [],
            before: [],
            after: []
        };

        return Migrate.mysql.verifyTableExist(migration.table_name).then(async res => {
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
            const tasks = [];
            if (res == false)
                tasks.push(createTable(migration.create(), migration, (el) => { checkConstraints(el) }));
            else
                tasks.push(alterTable(migration.create(), migration, (el) => { checkConstraints(el) }));

            tasks.push(mysql.addConstraint(migration.table_name, constraints));

            Promise.all(tasks).then();
        }).catch(err => {
            console.log(err);
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
            var names = [];
            if (res.length != 0)
                names = res.map(val => val.name);

            const executeMySql = (migration, file) => {
                try {
                    return Promise.all([
                        this.createTableOrUpdate(migration),
                        Migrate.mysql.insertValue('migrations', ['name'], [file])
                    ]);
                } catch (err) {
                    console.log(err);
                }
            }
            const tasks = this.files.map(originalFile => {
                if (names.includes(originalFile.getFileName()))
                    return Promise.resolve();

                return import(originalFile.getAbsolutePath()).then(module => {
                    if (migrated.indexOf(originalFile) === -1) {
                        return executeMySql(module, originalFile).then(() => {
                            migrated.push(originalFile);
                        });
                    }
                });
            });
            return Promise.all(tasks).then(() => migrated);
        }).catch(err => {
            throw err;
        });
    }

    handle() {
        return this.useFiles().then((migrated) => {
            console.log(`\n\nMigrate as successful, tables created in table database.\nCreated: ${migrated.length} tables`);
            //     // if (migrated.length > 0)
            //     //     console.log(`\tList of files migrated:\n${migrated.join('\n')}\n`)
        }).catch(err => {
            throw err
        });
    }

    afterHandle() { }
}

new Migrate();