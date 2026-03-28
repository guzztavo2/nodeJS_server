import Cli from '#core/support/Cli.js';

class createModel extends Cli {

    modelName = Cli.getArguments(2);

    initializeModelsPath() {
        return Config().get("models").then(models_path => {
            this.path = models_path + Directory().PathSep;
            this.modelDirectory = Directory(this.path);
        });
    }

    beforeHandle() {
        Cli.log("Creating Model...");
        if (!this.modelName)
            throw Error("Model name is required.");

        return this.initializeModelsPath().then(() => {
            const path = this.getPathFromParam(this.modelName);
            this.modelName = path[1];

            if (path[0]) {
                this.path = Directory().getAbsolutePath(this.path + path[0]);
                this.modelDirectory = Directory(this.path);
                return Directory().makeDirectories(this.path, true);
            }
        })
    }

    handle() {
        const modelFile = File(this.modelName + ".js", this.path);
        const modelResourcePath = Directory().getRelativePath(Directory().getAbsolutePath("./resources/Model.js"), this.modelDirectory.getAbsolutePath());

        return this.modelDirectory.readDirectory().then(collection =>
            collection.filter(val => val.getValue() instanceof File() && val.getValue().getAbsolutePath() == modelFile.getAbsolutePath()))
            .then(collection => {
                if (collection.getLength() > 0)
                    throw "File aready exists: " + modelFile.getAbsolutePath();
            }).then(() => {
                return modelFile.create(`import Model from "${modelResourcePath}";\n \n class ${this.modelName} extends Model {\n     table = '';\n \n     fillable = [\n         'id',\n         'name',\n         'email'\n     ]\n \n     hidden = [\n         'password'\n     ]\n \n     cast = {\n         "users": "object"\n     }\n \n }\n export default ${this.modelName};`)
                    .then(res => res ?
                        Cli.log((`${this.modelName} file created a successful.`) + (`\nFile Path: ${modelFile.getAbsolutePath()}`)) :
                        Cli.logError("Failed to create model file.")
                    ).catch(err => { throw err })
            }).catch(err => { throw err });
    }

    afterHandle() { }
}

new createModel();