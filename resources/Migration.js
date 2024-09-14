class Migration {

    vars = [];
    size;


    string(var_name, size = 255) {
        const migration = new Column(var_name, "VARCHAR", size);
        this.size = this.vars.push(migration);
        return migration;
    }

    tinyText(var_name) {
        const migration = new Column(var_name, "TINYTEXT");
        this.size = this.vars.push(migration);
        return migration;
    }

    text(var_name, size) {
        const migration = new Column(var_name, "TEXT", size);
        this.size = this.vars.push(migration);
        return migration;
    }

    blob(var_name, size) {
        const migration = new Column(var_name, "BLOB", size);
        this.size = this.vars.push(migration);
        return migration;
    }
    mediumText(var_name) {
        const migration = new Column(var_name, "MEDIUMTEXT");
        this.size = this.vars.push(migration);
        return migration;
    }
    mediumBlob(var_name) {
        const migration = new Column(var_name, "MEDIUMBLOB");
        this.size = this.vars.push(migration);
        return migration;
    }
    longText(var_name) {
        const migration = new Column(var_name, "LONGTEXT");
        this.size = this.vars.push(migration);
        return migration;
    }
    longBlob(var_name) {
        const migration = new Column(var_name, "LONGBLOB");
        this.size = this.vars.push(migration);
        return migration;
    }
    blob(var_name, size) {
        const migration = new Column(var_name, "BLOB", size);
        this.size = this.vars.push(migration);
        return migration;
    }
    json(var_name, size) {
        const migration = new Column(var_name, "JSON", size);
        this.size = this.vars.push(migration);
        return migration;
    }
    bigInt(var_name, size) {
        const migration = new Column(var_name, "BIGINT", size);
        this.size = this.vars.push(migration);
        return migration;
    }
    unsignedBigInt(var_name, size) {
        const migration = (new Column(var_name, "BIGINT", size)).unsigned(true);
        this.size = this.vars.push(migration);
        return migration;
    }
    id() {
        const migration = (new Column('id', "BIGINT", null)).unsigned(true).autoIncrement(true).primaryKey(true).index(true);
        this.size = this.vars.push(migration);
        return migration;
    }
    foreignKey(var_name, references, from) {
        const migration = (new Column(var_name, "BIGINT", null)).unsigned(true).foreignKey(true, references, from);
        this.size = this.vars.push(migration);
        return migration;
    }


}

class Column {
    name;
    type;
    size;
    nullable_var = null;
    primary_key_var = false;
    unique_var = false;
    foreignKey_var = false;
    check_var = false;
    default_var = false;
    index_var = false;
    autoIncrement_var = false;
    unsigned_var = false;
    after_var = false;
    before_var = false;
    constructor(name, type, size = null) {
        this.name = name;
        this.type = type;
        this.size = size;
    }
    setColumnName(name) {
        this.name = name;
    }
    nullable(nullable = null) {
        this.nullable_var = nullable;
        return this;
    }
    primaryKey(primary_key = false) {
        this.primary_key_var = primary_key;
        return this;
    }
    unique(unique = false) {
        this.unique_var = unique;
        return this;
    }
    foreignKey(foreignKey = false, references, from) {
        if (foreignKey == false)
            this.foreignKey_var = foreignKey;
        else
            this.foreignKey_var = { references: references, from: from }

        return this;
    }
    check(check = false) {
        this.check_var = check;
        return this;
    }
    default(defaultSql = false) {
        this.default_var = defaultSql;
        return this;
    }
    index(index = false) {
        this.index_var = index;
        return this;
    }
    autoIncrement(autoIncrement = false) {
        this.autoIncrement_var = autoIncrement;
        return this;
    }
    unsigned(unsigned = false) {
        this.unsigned_var = unsigned;
        return this;
    }
    after(column = false) {
        this.after_var = column;
        return this;
    }

    before(column = false) {
        this.before_var = column;
        return this;
    }

    toSQL() {
        const unsigned = this.unsigned_var == false ? "" : " UNSIGNED";

        let notNull = '';

        if (this.nullable_var !== null)
            notNull = this.nullable_var == true ? "" : " NOT NULL";

        const default_var = this.default_var == false ? "" : " DEFAULT " + this.default_var;
        const autoIncrement = this.autoIncrement_var == false ? "" : " AUTO_INCREMENT";
        const size = this.size == null ? "" : `(${this.size})`;
        const primary_key_var = this.primary_key_var == false ? "" : " PRIMARY KEY"
        return {
            "column_name": this.name,
            "sql": this.type + size + unsigned + notNull + autoIncrement + primary_key_var + default_var
        }
    }
}
module.exports = Migration;