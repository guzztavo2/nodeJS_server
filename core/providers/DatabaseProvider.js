import MySql from "#core/database/MySql.js";

class DatabaseProvider {
    register(container) {
        container.singleton('db', () => {
            return new MySql();
        });
    }
}

export default DatabaseProvider;