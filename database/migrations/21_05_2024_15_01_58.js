import Migration from '#core/database/Migration.js';

const randomMigration = new class extends Migration {
    table_name = "user";

    create() {
        return [
            this.id(),
            this.string('name').nullable(true),
            this.string('email').unique(),
            this.string('password').nullable(false),
            this.json('items').nullable(false),
            this.createdAt(),
            this.updatedAt()
        ];
    }
}

export default randomMigration;