const fs = require('fs');
const DateTime = require('../resources/DateTime');
const { dir } = require('console');
console.log('\n\nYou can define name of your migration. \n');
console.log("\tExample: node cli/migrate.js create_table_user. \n\n");

const stringTreatment = (string) => {
    string = string.replaceAll(' ', '_');
    return string.replaceAll(':', '_');
}
let migrationName = process.argv[2] ?? null;

let dateNow = DateTime.now();

dateNow = stringTreatment(dateNow).replaceAll('/', '_');;

if (migrationName == null) {
    migrationName = dateNow;
} else {
    try {
        if (migrationName.indexOf('/') !== -1) {
            const aux = migrationName.split('/').slice(0, migrationName.split('/').length - 1);
            aux.forEach(async value => {
                fs.mkdirSync('./migrations/' + value);
            });
        }
    } catch (error) {
        console.log("Not possible create migrations file. \n\n Error: " + error);
        return;
    }

    migrationName = stringTreatment(migrationName) + dateNow;
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


const path = getRealPath();

if (fs.existsSync(path + migrationName + ".js")) {
    console.log("It is not possible to create a Migration with the same name as another.");
    return;
}
try {
    fs.appendFileSync(path + migrationName + ".js",
        `const Migration = require("../resources/Migration");\n\nconst randomMigration = new class extends Migration {\n    table_name = "table_name";\n\n    create() {\n        return [\n            this.id()\n        ];\n    }\n}\n\nmodule.exports = randomMigration;`, (err) => {
            console.log(err);
        });

    console.log((`${migrationName} file created a successful.`) + (`File Path: ${path + migrationName}.js`));

} catch (error) {
    console.log("Not possible create archive: " + migrationName + "\n\nError:\n" + error);
}
