const fs = require('fs');

if (process.argv[2] == null) {
    console.log("Controller's name it's necessary to create a controller.");
    console.log("Example: node cli/createController.js HomeController.");
    return;
}
const controllerName = process.argv[2].toString().replaceAll(/[^a-z{/}]/gm, "");
const changeDirectory = () => {
    let directory = process.argv[1];
    directory = directory.split('/');
    directory.pop();
    directory = directory.join('/');
    process.chdir(directory)
}
const getRealPath = () => {
    changeDirectory();
    const path = "../controllers/"
    try {
        fs.realpathSync(path);
    }
    catch (error) {
        return "./controllers/";
    }
    return path;
}

const path = getRealPath();

if (fs.existsSync(path + controllerName + ".js")) {
    console.log("It is not possible to create a Controller with the same name as another.");
    return;
}
try {
    fs.appendFileSync(path + controllerName + ".js",
        `const Controller = require('../resources/Controller');\nclass ${controllerName} extends Controller{\n\n\n}\n\nmodule.exports = ${controllerName};`, (err) => {
            console.log(err);
        });

    console.log((`${controllerName} file created a successful.`) + (`File Path: ${path + controllerName}.js`));

} catch (error) {
    console.log("Not possible create archive: " + controllerName + "\nError:" + error);
} finally{
    exit(0);
}
