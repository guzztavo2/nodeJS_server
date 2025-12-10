import Utils from "./Utils.js";

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

    integer(var_name, size) {
        const migration = (new Column(var_name, "INT", size));
        this.size = this.vars.push(migration);
        return migration;
    }

    smallInteger(var_name, size) {
        const migration = (new Column(var_name, "SMALLINT", size));
        this.size = this.vars.push(migration);
        return migration;
    }

    float(var_name) {
        const migration = (new Column(var_name, "FLOAT"));
        this.size = this.vars.push(migration);
        return migration;
    }

    double(var_name) {
        const migration = (new Column(var_name, "DOUBLE"));
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

    date(var_name) {
        const migration = (new Column(var_name, "DATE"));
        this.size = this.vars.push(migration);
        return migration;
    }
    
    dateTime(var_name) {
        const migration = (new Column(var_name, "DATETIME"));
        this.size = this.vars.push(migration);
        return migration;
    }
    
    timeStamp(var_name) {
        const migration = (new Column(var_name, "TIMESTAMP"));
        this.size = this.vars.push(migration);
        return migration;
    }
    
    bool(var_name) {
        const migration = (new Column(var_name, "TINYINT", '1'));
        this.size = this.vars.push(migration);
        return migration;
    }

    createdAt(){
        const migration = (new Column('created_at', "TIMESTAMP", null)).default("CURRENT_TIMESTAMP");
        this.size = this.vars.push(migration);
        return migration;
    }
    
    updatedAt(){
        const migration = (new Column('created_at', "TIMESTAMP", null)).default("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        this.size = this.vars.push(migration);
        return migration;
    }

}

class Column {
    name;
    type;
    size;
    nullable_var = false;
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
        this.size = size ?? false;
    }

    setColumnName(name) {
        this.name = name;
    }

    nullable(nullable = null) {
        this.nullable_var = nullable ?? false;
        return this;
    }

    primaryKey(primary_key = false) {
        this.primary_key_var = primary_key;
        return this;
    }

    unique(unique = true) {
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

        const default_var = !Utils.is_empty(this.default_var) ? " DEFAULT " + this.default_var : "";
        const autoIncrement = !Utils.is_empty(this.autoIncrement_var) ? " AUTO_INCREMENT" : "";
        const size = !Utils.is_empty(this.size) ? `(${this.size})` : "";
        const primary_key_var = !Utils.is_empty(this.primary_key_var) ? " PRIMARY KEY" : "";

        return {
            "column_name": this.name,
            "sql": this.type + size + unsigned + notNull + autoIncrement + primary_key_var + default_var
        }
    }

}
export default Migration;