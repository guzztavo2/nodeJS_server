import Cli from '#core/support/Cli.js';

class createController extends Cli {

    controllerArgument = Cli.getArguments(2);
    fileController;

    initializeControllersPath() {
        return Config().get("controllers").then(controller_path => {
            this.path = controller_path;
            this.controllerDirectory = Directory(this.path);
        });
    }

    beforeHandle() {
        Cli.log("Creating Controller...");
        if (!this.controllerArgument)
            throw Error("Controller name is required.");
        return this.initializeControllersPath().then(() => {
            const path = this.getPathFromParam(this.controllerArgument);
            this.controllerArgument = path[1];

            if (path[0]) {
                return Directory().makeDirectories(this.path + Directory().PathSep + path[0], true).then(() => {
                    this.path = Directory().getAbsolutePath(this.path + Directory().PathSep + path[0]);
                    this.controllerDirectory = Directory(this.path);
                });
            } else
                return Promise.resolve();
        });
    }

    handle() {
        const controllerName = this.getControllerName();
        this.fileController = File(controllerName + ".js", this.path);
        const controllerResourcePath = Directory().getRelativePath(Directory().getAbsolutePath("./resources/Controller.js"), this.controllerDirectory.getAbsolutePath());

        return this.controllerDirectory.readDirectory()
            .then(files => files.filter(value => value.getValue() instanceof File() && value.getValue().getAbsolutePath() == this.fileController.getAbsolutePath()))
            .then(files => { if (files.getLength() > 0) throw Error("It is not possible to create a Controller with the same name as another.") })
            .then(() => this.fileController.create(`import Controller from '${controllerResourcePath}';\n\nclass ${controllerName} extends Controller{\n\n\n}\n\nexport default ${controllerName};`)
                .then(res => {
                    if (res)
                        return Cli.exit((`${controllerName} file created a successful.`) + (`\nFile Path: ${this.fileController.getAbsolutePath()}`));
                    Cli.exitError("Failed to create controller file.");
                }).catch(err => Cli.exitError(err)));
    }

    getControllerName() {
        const str = Cli.stringTreatment(this.controllerArgument, true, [{ "/[^a-z{/}]/gm": "" }]);
        this.controllerArgument = str.toLocaleLowerCase().includes("controller") ? str : str + "Controller";
        return this.controllerArgument;
    }
}

new createController();