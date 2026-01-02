import Directory from "../resources/Directory.js";
import File from "../resources/File.js";
import DateTime from "../resources/DateTime.js";
import Cli from "../resources/Cli.js";

class CreateMigration extends Cli {

    migrationName = Cli.getArguments(2);
    modelName = "table_name_here";
    dateNow = CreateMigration.formatDate();
    migrationsDirectory = new Directory("migrations");
    path;

    beforeHandle() {
        console.log('\n\nYou can define name of your migration. \n');
        console.log("\tExample: node cli/migrate.js create_table_user. \n\n");
        this.path = this.migrationsDirectory.getAbsolutePath() + Directory.PathSep
        this.migrationsDirectory = new Directory(this.path);

        if (!this.migrationName) {
            this.migrationName = this.dateNow + ".js";
            this.modelName = this.migrationName;
        } else {
            const path = this.getPathFromParam(this.migrationName);
            this.migrationName = path[1];
            this.modelName = this.migrationName;
            this.migrationName = this.dateNow + "_" + this.migrationName + ".js";

            if (path[0]) {
                this.path = Directory.getAbsolutePath(this.path + path[0]);
                this.migrationsDirectory = new Directory(this.path);
                return Directory.makeDirectories(this.path, true);
            }
        }
    }

    handle() {
        const migrationFile = new File(this.migrationName, this.path);
        const migrationResourcePath = Directory.getRelativePath(Directory.getAbsolutePath("./resources/Migration.js"), this.migrationsDirectory.getAbsolutePath());

        return this.migrationsDirectory.readDirectory().then(collection =>
            collection.filter(val => val.getValue() instanceof File && val.getValue().getAbsolutePath() == migrationFile.getAbsolutePath()))
            .then(collection => {
                if (collection.getLength() > 0)
                    throw Error("File aready exists: " + migrationFile.getAbsolutePath());
            }).then(() => {
                return migrationFile.create(`import Migration from "${migrationResourcePath}";\n\nconst randomMigration = new class extends Migration {\n    table_name = "${this.modelName}";\n\n    create() {\n        return [\n            this.id()\n        ];\n    }\n}\n\nexport default randomMigration;`)
                    .then(res => res ?
                        console.log(`File created sucessful: ${migrationFile.getFileName()} \n ${migrationFile.getAbsolutePath()}`) :
                        console.error(`[ERROR] creating file: ${migrationFile.getRelativePath()}`)
                    ).catch(err => console.error(`[ERROR] creating file: ${migrationFile.getRelativePath()} - ${err}`))
            }).catch(err => { throw Error(`Not possible create directory: ${err}`) });

    }

    afterHandle() { }

    static formatDate() {
        const date = DateTime.dateObject();
        return `${date.y}_${date.mm}_${date.d}_${date.h}_${date.m}_${date.s}`;
    }
}

new CreateMigration();