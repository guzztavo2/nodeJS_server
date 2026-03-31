import Migration from '#core/database/Migration.js';;

const randomMigration = new class extends Migration {
    table_name = "user";

    create() {
        return [
            this.string('name').nullable(true).after('id')
        ];
    }
}

export default randomMigration;