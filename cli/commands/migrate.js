import Container from '#core/container/Container.js';
import Cli from '#core/support/Cli.js';

class Migrate extends Cli {

    files = [];
    static DB = null;

    tables_created = []
    tables_updated = []

    initializeModelsPath() {
        return Config().get("migrations").then(migrations_path => {
            this.path = migrations_path;
            this.migrationFolderPath = Directory(this.path);
        });
    }

    createMigrationTableIfNotExist() {
        return Migrate.DB.verifyTableExist('migrations').then(res_ => {
            if (!res_)
                return Migrate.DB.createMigrationTable().then().catch(err => {
                    throw err;
                });
        }).catch(err => {
            throw err;
        });
    }

    prepareTable(result, callback){
        let query = {};
        
        result.forEach(el => {
            const SQL = el.toSQL();
            const key = SQL.column_name;
            const sql = SQL.sql;

            const obj = {[key]:sql};

            query = {...query, ...obj};
            callback(el);
        })
        return query;
    }
    createTable(result, migration, callback) {
        const query = this.prepareTable(result, callback);
        return Migrate.DB.createTable(migration.table_name, query);
    }

    alterTable(result, migration, callback) {
        const query = this.prepareTable(result, callback);
        return Migrate.DB.alterTable(migration.table_name, query);
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

        return Migrate.DB.verifyTableExist(migration.table_name).then(res => {
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
                return this.createTable(migration.create(), migration, (el) => { checkConstraints(el) }).then(_ => Migrate.DB.addConstraint(migration.table_name, constraints));
            } else {
                this.tables_updated.push(migration.table_name)
                return this.alterTable(migration.create(), migration, (el) => { checkConstraints(el) }).then(_ => Migrate.DB.addConstraint(migration.table_name, constraints));
            }
        }).catch(err => {
            Cli.error(err);
        });
    }

    beforeHandle() {
        return Container.make("db").then(db => {
            Migrate.DB = db;
            return this.migrationFolderPath.readDirectory().then(files => {
                return files.valuesToArray().then(files => {
                    this.files = files.sort((a, b) => {
                        const parse = f => f.getFileName().split('.')[0];
                        return parse(a).localeCompare(parse(b));
                    });
                    return this.createMigrationTableIfNotExist().then().catch(err => Cli.exitError(err));
                });
            });
        });
    }

    useFiles() {
        const migrated = [];
        return Migrate.DB.selectAll('migrations').then(res => {
            let names = [];
            if (!empty(res))
                names = res.map(val => val.name);

            const executeMySql = (migration, file) => {
                return this.createTableOrUpdate(migration).then(() =>
                    Migrate.DB.insertValue('migrations', ['name'], [file.getRelativePath()])
                );
            };

            return this.files.reduce((promiseChain, originalFile) => {
                return promiseChain.then(() => {
                    if (names.includes(originalFile.getRelativePath())) {
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
            Cli.log(`Migrate as successful:`);
            if (!empty(this.tables_created) || !empty(this.tables_updated)) {
                if (!empty(this.tables_created))
                    Cli.log(`\nCreated tables: ${this.tables_created.join(", ")}`);
                if (!empty(this.tables_updated))
                    Cli.log(`\nUpdated tables: ${this.tables_updated.join(", ")}`);
                if (!empty(migrated.length)) 
                    Cli.log(`\nList of files migrated:\n${migrated.map(val => val.getRelativePath()).join('\n')}\n`)
            } else
                Cli.log("There are no tables to migrate.");
        }).catch(err => {
            throw err
        });
    }

    afterHandle() { }
}

new Migrate();