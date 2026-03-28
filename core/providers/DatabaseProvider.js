import MySql from "#core/database/MySql.js";

class DatabaseProvider {
    register(container) {
        container.singleton('db', () => new MySql());
    }
}

export default DatabaseProvider;