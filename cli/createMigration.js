const fs = require('fs');
const DateTime = require('../resources/DateTime');
const { dir } = require('console');
const e = require('express');
console.log('\n\nYou can define name of your migration. \n');
console.log("\tExample: node cli/migrate.js create_table_user. \n\n");

const stringTreatment = (string) => {
    string = string.trim();
    string = string.replaceAll(' ', '_');
    return string.replaceAll(':', '_');
}

const formatDate = () => {
    const now = new Date();

    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0'); // Mês começa do 0
    const DD = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const SS = String(now.getSeconds()).padStart(2, '0');

    return `${YYYY}_${MM}_${DD}_${HH}_${mm}_${SS}`;
};

let migrationName = process.argv[2] ?? null;

let modelName = "table_name_here";
let dateNow = formatDate();

dateNow = stringTreatment(dateNow).replaceAll('/', '_');

let actualPath = null;

if (migrationName == null)
    migrationName = dateNow;
else {
    migrationName = migrationName.toString().replaceAll(" ", "_").replaceAll(/[^a-z{/}{_}]/gm, "");
    try {
        if (migrationName.indexOf('/') !== -1) {
            const aux = migrationName.split('/').slice(0, migrationName.split('/').length - 1);
            aux.forEach(async value => {
                fs.mkdirSync('./migrations/' + value);
            });
            actualPath = aux + "/";
            migrationName = migrationName.replace(aux + "/", "");
        }
    } catch (error) {
        console.log("Not possible create migrations file. \n\n Error: " + error);
        return;
    }
    modelName = stringTreatment(migrationName);
    migrationName = dateNow + "_" + stringTreatment(migrationName);
}

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

if (actualPath != null)
    var path = getRealPath() + actualPath;
else
    var path = getRealPath();

if (fs.existsSync(path + migrationName + ".js")) {
    console.log("It is not possible to create a Migration with the same name as another.");
    return;
}

try {
    fs.appendFileSync(path + migrationName + ".js",
        `const Migration = require("../resources/Migration");\n\nconst randomMigration = new class extends Migration {\n    table_name = "${modelName}";\n\n    create() {\n        return [\n            this.id()\n        ];\n    }\n}\n\nmodule.exports = randomMigration;`, (err) => {
            console.log(err);
        });

    console.log((`${migrationName} file created a successful.`) + (`File Path: ${path + migrationName}.js`));

} catch (error) {
    console.log("Not possible create archive: " + migrationName + "\n\nError:\n" + error);
} finally {
    exit(0);
}
