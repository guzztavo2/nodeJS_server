import Directory from '#core/filesystems/Directory.js';
import File from "#core/filesystems/File.js";
import Cli from '#core/support/Cli.js';

class createMiddleware extends Cli {
    middlewareArgument = Cli.getArguments(2);
    path = Directory.getAbsolutePath("./middlewares/") + Directory.PathSep;
    middlewareDirectory = new Directory("middlewares", this.path);
    fileMiddleware;

    beforeHandle() {
        if (!this.middlewareArgument)
            throw Error("Middleware name is required.");

        const path = this.getPathFromParam(this.middlewareArgument);
        this.middlewareArgument = path[1];

        if (path[0]) {
            const promise = Directory.makeDirectories(this.path + path[0], true);
            this.path = Directory.getAbsolutePath(this.path + path[0]);
            this.middlewareDirectory = new Directory(this.path);
            return promise;
        }
    }

    handle() {
        const middlewareName = this.getMiddlewareName();
        this.fileMiddleware = new File(middlewareName + ".js", this.path);

        return this.middlewareDirectory.readDirectory()
            .then(files => files.filter(value => value.getValue() instanceof File && value.getValue().getAbsolutePath() == this.fileMiddleware.getAbsolutePath()))
            .then(files => { if (files.getLength() > 0) throw Error("It is not possible to create a Middleware with the same name as another.") })
            .then(() => this.fileMiddleware.create(`const middleware = new class {\n    identifier = "";\n\n    next(request, response, next) {\n        console.log("Middleware here's");\n        next();\n    }\n\n}\nexport default middleware;`)
                .then(res => {
                    if (res)
                        return Cli.log((`${middlewareName} file created a successful.`) + (`\nFile Path: ${this.fileMiddleware.getAbsolutePath()}`));
                    throw Error("Failed to create middleware file.");
                }).catch(err => { throw Error(err) }));
    }

    getMiddlewareName() {
        const str = Cli.stringTreatment(this.middlewareArgument, true, [{ "/[^a-z{/}]/gm": "" }]);
        this.middlewareArgument = str;
        return this.middlewareArgument;
    }
}

new createMiddleware();