const Migration = require("../resources/Migration");

const randomMigration = new class extends Migration {
    table_name = "user";

    create() {
        return [
            this.id(),
            this.string('name').nullable(true),
            this.string('email').unique(true),
            this.string('password').nullable(false),
            this.json('items').nullable(false),
        ];
    }
}

module.exports = randomMigration;