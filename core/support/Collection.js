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
        return this.ready().then(collection => {
            return collection.collection.length;
        })
    }

    synchronize() {

        return collection.ready().then(collection => {
            const sinchronizedCollection = new Collection();
            sinchronizedCollection.collection = this.collection;
            sinchronizedCollection.map((value_, index_) => collection[index_] = value_.getValue());
            return sinchronizedCollection;
        });

    }

    generateKey() {
        return this.getLength().then(possibleKey => {
            return possibleKey;
        });
    }

    add(value, key = null) {
        return this.ready().then(collection => {
            const createValue = (value, key) => {
                return new TypeCollection(key, value);
            };

            if (Utils.is_empty(key))
                return this.generateKey().then(generatedKey => {
                    const dataCreated = createValue(value, generatedKey);
                    this[generatedKey] = dataCreated;
                    collection.collection.push(dataCreated);
                    return collection;
                });

            const dataCreated = createValue(value, key);
            this[key] = dataCreated;
            collection.collection.push(dataCreated);
            return collection;
        });
    }

    push(value) {
        this.add(null, value);
    }

    async replaceByValue(oldValue, newValue) {
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
        });
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
                        collectionFiltered.add(val.getValue(), val.getKey());
                });

            });

            return Promise.all(tasks).then(() => collectionFiltered);
        });
    }

    map(func_) {
        const promises = this.collection.map((item, i) => Promise.resolve(func_(item, i)));
        return Promise.all(promises).then(results => {

            const mapped = new Collection();
            for (let i = 0; i < results.length; i++) {
                const result = results[i];

                if (typeof result == "string" || !result)
                    if (!result || result.toLowerCase() == "continue") continue;
                    else if (result.toLowerCase() == "break") break;

                if (result instanceof TypeCollection) {
                    mapped.collection[i] = result;
                    mapped[i] = result;
                }

            }
            return mapped;
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

    get(key) {
        return new Promise(resolve => this.filter((value_, index) => {
            if(Utils.is_array(key)){
                if(key.includes(value_.getKey()))
                    return true;
            }else
                if ((String(value_.getKey())).indexOf(key) != -1)
                    return resolve(value_.getValue());

        }).then(collection => collection.getLength().then(numberOfItems => {
            if (numberOfItems == 0)
                resolve(false);
            return resolve(collection);
        })));
    }

    getByIndex(index) {
        return this.ready().then(collect => {
            return collect[index];
        });
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
        return this.ready().then(collect => {
            return collect.collection[0];
        })
    }

    last() {
        return this.ready().then(collect => {
            return collect.collection[collect.collection.length - 1];
        })
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
        if (collection instanceof Collection)
            return collection.toArray();
        return false;
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