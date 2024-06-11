const Migration = require("../resources/Migration");

const randomMigration = new class extends Migration {
    table_name = "user";

    create() {
        return [
            this.string('name').nullable(true).after('id')
        ];
    }
}

module.exports = randomMigration;