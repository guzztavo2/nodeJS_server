import Cli from '#core/support/Cli.js';

class createMiddleware extends Cli {
    middlewareArgument = Cli.getArguments(2);
    fileMiddleware;

    initializeMiddlewaresPath() {
        return Config().get("middlewares").then(middleware_path => {
            this.path = middleware_path;
            this.middlewareDirectory = Directory(this.path);
        });
    }

    beforeHandle() {
        if (!this.middlewareArgument)
            throw Error("Middleware name is required.");

        return this.initializeMiddlewaresPath().then(() => {
            const path = this.getPathFromParam(this.middlewareArgument);
            this.middlewareArgument = path[1];

            if (path[0]) {
                return Directory().makeDirectories(this.path + path[0], true).then(() => {
                    this.path = Directory().getAbsolutePath(this.path + path[0]);
                    this.middlewareDirectory = Directory(this.path);
                });
            }
        });
    }

    handle() {
        const middlewareName = this.getMiddlewareName();
        this.fileMiddleware = File(middlewareName + ".js", this.path);

        return this.middlewareDirectory.readDirectory()
            .then(files => files.filter(value => value.getValue() instanceof File() && value.getValue().getAbsolutePath() == this.fileMiddleware.getAbsolutePath()))
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