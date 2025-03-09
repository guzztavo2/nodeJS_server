const fs = require('fs');
const { exit } = require('process');

if (process.argv[2] == null) {
    console.log("\nModel's name it's necessary to create a Model.");
    console.log("Example: node cli/User.js -- User created.\n");
    return;
}
const modelName = process.argv[2].toString().replaceAll(/[^a-z{/}]/gm, "");
const changeDirectory = () => {
    let directory = process.argv[1];
    directory = directory.split('/');
    directory.pop();
    directory = directory.join('/');
    process.chdir(directory)
}
const getRealPath = () => {
    changeDirectory();
    const path = "../models/"
    try {
        fs.realpathSync(path);
    }
    catch (error) {
        return "./models/";
    }
    return path;
}


const path = getRealPath();

if (fs.existsSync(path + modelName + ".js")) {
    console.log("\nIt is not possible to create a Model with the same name as another.\n");
    return;
}
try {
    fs.appendFileSync(path + modelName + ".js",
        `const Model = require("../resources/Model");\n\nclass ${modelName} extends Model {\n    table = '';\n\n    fillable = [\n        'id',\n        'name',\n        'email'\n    ]\n\n    hidden = [\n        'password'\n    ]\n\n    cast = {\n        "users": "object"\n    }\n\n}\nmodule.exports = ${modelName};`, (err) => {
            console.log(err);
        });

    console.log((`\n${modelName} file created a successful.\n`) + (`\nFile Path: ${path + modelName}.js\n`));

} catch (error) {
    console.log("\nNot possible create archive: " + modelName + "\nError:" + error + "\n");
} finally{
    exit(0);
}
