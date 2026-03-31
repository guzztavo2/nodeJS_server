import DateTime from "#core/support/DateTime.js";
import Cli from "#core/support/Cli.js";
import Log from "#core/support/Log.js";

class CreateMigration extends Cli {

    migrationName;
    modelName = "table_name_here";
    dateNow = CreateMigration.formatDate();

    constructor(migrationName = null) {
        super();
        this.migrationName = migrationName || Cli.getArguments(2);
    }

    initializeMigrationPath() {
        return Config().get("migrations").then(migration_path => {
            this.path = migration_path + Directory().PathSep;
            this.migrationsDirectory = Directory(this.path);
        });
    }

    beforeHandle() {
        Cli.log('You can define name of your migration. \n');
        Cli.log("Example: node cli/migrate.js create_table_user. \n\n");
        return this.initializeMigrationPath().then(() => {
            if (!this.migrationName) {
                this.migrationName = this.dateNow + ".js";
                this.modelName = this.migrationName;
            } else {
                const path = this.getPathFromParam(this.migrationName);
                this.migrationName = path[1];
                this.modelName = this.migrationName;
                this.migrationName = this.dateNow + "_" + this.migrationName + ".js";

                if (path[0]) {
                    this.path = Directory().getAbsolutePath(this.path + path[0]);
                    this.migrationsDirectory = Directory(this.path);
                    return Directory().makeDirectories(this.path, true);
                }
            }
        });
    }

    handle() {
        const migrationFile = File(this.migrationName, this.path);
        const migrationResourcePath = Directory().getRelativePath(Directory().getAbsolutePath("core/database/Migration.js"), this.migrationsDirectory.getAbsolutePath());

        return this.migrationsDirectory.readDirectory().then(collection =>
            collection.filter(val => val instanceof File() && val.getAbsolutePath() == migrationFile.getAbsolutePath()))
            .then(collection => {
                if (collection.getLength() > 0)
                    throw Error("File aready exists: " + migrationFile.getAbsolutePath());
            }).then(() => {
                return migrationFile.create(`import Migration from "${migrationResourcePath}";\n\nconst randomMigration = new class extends Migration {\n    table_name = "${this.modelName}";\n\n    create() {\n        return [\n            this.id()\n        ];\n    }\n}\n\nexport default randomMigration;`)
                    .then(res => res ?
                        Log.message(`File created sucessful: ${migrationFile.getFileName()} \n ${migrationFile.getAbsolutePath()}`) :
                        Log.error(`creating file: ${migrationFile.getRelativePath()}`)
                    ).catch(err => Log.error(`creating file: ${migrationFile.getRelativePath()} - ${err}`))
            }).catch(err => { throw Error(`Not possible create directory: ${err}`) });
    }

    afterHandle() { }

    static formatDate() {
        const date = DateTime.dateObject();
        return `${date.y}_${date.mm}_${date.d}_${date.h}_${date.m}_${date.s}`;
    }
}

new CreateMigration();