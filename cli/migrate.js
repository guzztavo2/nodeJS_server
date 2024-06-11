const fs = require('fs');
const MySql = require('../resources/MySql');
require('dotenv').config()

console.log("You can pass dir's name to migrate:\n\tExample: node cli/migrate.js test/example/.\n\tResult Migration: migrations/test/example\n\n");

const changeDirectory = () => {
    let directory = process.argv[1];
    directory = directory.split('/');
    directory.pop();
    directory = directory.join('/');
    process.chdir(directory)
}
const getRealPath = () => {
    changeDirectory();
    const path = "../migrations/"
    try {
        fs.realpathSync(path);
    }
    catch (error) {
        return "./migrations/";
    }
    return path;
}

const path = getRealPath();

const folderMigration = process.argv[2] == null ? path : path + process.argv[2];
let files = [];
try {
    files = fs.readdirSync(folderMigration)
} catch {
    throw Error("\n\nNot possible examine this dir: \n" + folderMigration);
}

const mysql = new MySql();

const createMigrationTableIfNotExist = async (mysql) => {
    const res = await mysql.verifyTableExist('migrations');
    if (res == false)
        await mysql.createMigrationTable();
}

async function createTable(result, mysql, migration, callback) {
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
    await mysql.createTable(migration.table_name, query).then().catch(err => { throw Error(err) })
}
async function alterTable(result, mysql, migration, callback) {
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
    await mysql.alterTable(migration.table_name, query);
}

const useFiles = async (files, folderMigration, mysql) => {

    return await new Promise(async (res, err) => {
        try {
            await createMigrationTableIfNotExist(mysql);

            const migrated = [];

            for (n = 0; n < files.length; n++) {
                const file = files[n];

                let names = [];

                await mysql.selectAll('migrations').then(res => {

                    if (res == 0) return;

                    names = res.map(val => val.name);
                }).catch(err => { throw Error(err); });

                if (names.length > 0 && names.includes(file))
                    continue;

                try {
                    await createTableOrUpdate(mysql, folderMigration, file);

                    await mysql.insertValue('migrations', ['name'], [file]);
                    migrated.push(file);
                } catch (err) {
                    continue;
                }
            }
            res(migrated);
        }
        catch (error) {
            err(error);
        }
    })

}

async function createTableOrUpdate(mysql, folderMigration, file) {
    const migration = require(folderMigration + file);
    let constraints = {
        unique: [],
        foreignKey: [],
        check: [],
        index: [],
        before: [],
        after: []
    };
    await mysql.verifyTableExist(migration.table_name).then(async res => {

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
        if (res == false)
            createTable(migration.create(), mysql, migration, (el) => checkConstraints(el));
        else
            alterTable(migration.create(), mysql, migration, (el) => checkConstraints(el));

        await mysql.addConstraint(migration.table_name, constraints)

    }).catch(err => {
        throw Error(err);
    });
}
useFiles(files, folderMigration, mysql).then(res => {
    console.log(`\n\nMigrate as successful, tables created in table database.\nCreated: ${res.length} tables`);
    if (res.length > 0)
        console.log(`\tList of files migrated:\n${res.join('\n')}\n`)
}).catch(err => {
    throw Error(err);
});