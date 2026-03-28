import Migration from '#core/database/Migration.js';;

const randomMigration = new class extends Migration {
    table_name = "user";

    create() {
        return [
            this.string('items_2').nullable(true).after('items')
        ];
    }
}

export default randomMigration;