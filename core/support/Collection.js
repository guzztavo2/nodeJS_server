import Utils from '#core/support/Utils.js';

class Collection {
    collection = [];

    constructor(array = null) {
        this.initPromise = array ? this.createFromArrayObjects(array) : Promise.resolve(this);
    }

    ready() {
        return this.initPromise;
    }

    getLength() {
        return this.collection.length;
    }

    synchronize() {
        const collection = new Collection();
        collection.collection = this.collection;
        collection.map((value_, index_) => collection[index_] = value_.getValue());

        return collection;
    }

    add(value, key = null) {
        const valuedKey = this.getLength();
        key = key == null ? valuedKey : key;
        const dataCreated = new TypeCollection(key, value);
        this[key] = dataCreated;
        this.collection.push(dataCreated);
        return this;
    }

    push(value) {
        this.add(null, value);
    }

    async updateByValue(oldValue, newValue) {
        let updated = false;
        await this.map((val, _) => {
            if (val.getValue() === oldValue) {
                val.setValue(newValue);
                updated = true;
            }
            else {
                if (updated) return "break";
                return "continue";
            }

            return val;
        })
        return this;
    }

    updateByKey(key_, value) {
        let updated = false;
        this.map((val, _) => {
            if (key_ == val.getKey()) {
                val.setValue(value);
                updated = true;
            }
            else
                if (!updated) return "continue";
                else return "break";
            return val;
        })
    }
    
    filter(func_) {
        const collectionFiltered = new Collection();
        return this.ready().then(() => {
            const tasks = this.collection.map((val, key) => {

                return Promise.resolve(func_(val, key)).then(res => {
                    if (res)
                        collectionFiltered.add(val.getValue());
                });
            });

            return Promise.all(tasks).then(() => collectionFiltered);
        });
    }

    map(func_) {
        const promises = this.collection.map((item, i) => Promise.resolve(func_(item, i)));
        return Promise.all(promises).then(results => {

            const collectionMapped = new Collection();
            for (let i = 0; i < results.length; i++) {
                const result = results[i];

                if (typeof result == "string" || !result)
                    if (!result || result.toLowerCase() == "continue") continue;
                    else if (result.toLowerCase() == "break") break;

                if (result instanceof TypeCollection) {
                    collectionMapped.collection[i] = result;
                    collectionMapped[i] = result;
                }

            }
            return collectionMapped;
        });

    }

    removeByKey(key) {
        const index = this.collection.findIndex((value) => {
            return (value.getKey()).indexOf(key) != -1;
        });

        this.collection.splice(index, 1);
        return this.synchronize();
    }

    removeByValue(value) {
        const index = this.collection.findIndex((value_) => {
            return (value_.getValue()).indexOf(value) != -1;
        })

        this.collection.splice(index, 1);
        return this.synchronize();
    }

    findByKey(key) {
        return this.collection.filter((value_) => {
            return (String(value_.getKey())).indexOf(key) != -1;
        })
    }

    getByIndex(index) {
        return this.collection[index];
    }

    findByValue(valueFind) {
        if (typeof valueFind == 'function')
            return this.collection.filter(valueFind);
        return this.collection.filter((value_, index_) => {
            const value = value_.getValue();

            if (typeof value == 'object') {
                for (const [key_, value_] of Object.entries(value_.getValue()))

                    if ((String(value_)).indexOf(valueFind) != -1)
                        return [value_, key_];
            }
        });
    }

    first() {
        return this.collection[0];
    }

    last() {
        return this.collection[(this.collection.length - 1)];
    }

    createFromArrayObjects(array_) {
        Utils.validateArray(array_, 'array_');
        return Promise.resolve(array_).then(resolvedArray => {
            for (let value of resolvedArray) {
                this.add(typeof value === "object" ? Object.assign({}, value) : value).getLength() - 1;
            }
            return this;
        });
    }

    static createFromArrayObjects(array_) {
        const collection = new Collection(array_);
        return collection;
    }

    toArray() {
        return this.collection.map(val => val.getValue());
    }

    static toArray(collection) {
        return collection.toArray();
    }
}

class TypeCollection {
    key; value;

    constructor(key = null, value = null) {
        this.key = key;
        this.value = value;
    }


    setKey(key) {
        this.key = key;
        return this;
    }

    getKey() {
        return this.key;
    }

    setValue(value) {
        this.value = value;
        return this;
    }

    getValue() {
        return this.value;
    }


}
export default Collection;