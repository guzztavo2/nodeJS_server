const fs = require('fs');

if (process.argv[2] == null) {
    console.log("Middleware's name it's necessary to create a middleware.");
    console.log("Example: node cli/createMiddleware.js UserVerification.");
    return;
}
const middlewareName = process.argv[2].toString().replaceAll(/[^a-z{/}]/gm, "");
const changeDirectory = () => {
    let directory = process.argv[1];
    directory = directory.split('/');
    directory.pop();
    directory = directory.join('/');
    process.chdir(directory)
}
const getRealPath = () => {
    changeDirectory();
    const path = "../middlewares/"
    try {
        fs.realpathSync(path);
    }
    catch (error) {
        return "./middlewares/";
    }
    return path;
}

const path = getRealPath();

if (fs.existsSync(path + middlewareName + ".js")) {
    console.log("It is not possible to create a Middleware with the same name as another.");
    return;
}
try {
    fs.appendFileSync(path + middlewareName + ".js",
        `const middleware = new class {\n    identifier = "";\n\n    next(request, response, next) {\n        console.log("Middleware here's");\n        next();\n    }\n\n}\nmodule.exports = middleware;`,
        (err) => {
            console.log(err);
        });

    console.log((`${middlewareName} file created a successful.`) + (`File Path: ${path + middlewareName}.js`));

} catch (error) {
    console.log("Not possible create archive: " + middlewareName + "\nError:" + error);
} finally {
    exit(0);
}