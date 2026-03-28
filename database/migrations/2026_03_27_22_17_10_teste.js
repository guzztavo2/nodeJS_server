import Migration from "../../core/database/Migration.js";

const randomMigration = new class extends Migration {
    table_name = "teste";

    create() {
        return [
            this.id()
        ];
    }
}

export default randomMigration;