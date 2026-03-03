import Utils from '#core/support/Utils.js';

class Collection {
    collection = [];
    quantity = 0;
    keys_not_avaible = ["collection", "quantity"];
    keyMap = {};

    constructor(array = null) {
        this.initPromise = array ? this.createFromArrayObjects(array) : Promise.resolve(this);
    }

    ready() {
        return this.initPromise;
    }

    getLength() {
        return this.ready().then(collection => {
            if (!Utils.is_empty(this.quantity))
                return this.quantity;
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
        const createValue = (value, index, oldIndex = null) => {
            const data = new TypeCollection(index, value);
            this[index] = data;
            this.collection.push(data);
            if(!Utils.is_empty(oldIndex))
                this.keyMap[index] = oldIndex;

            this.collection_len = (this.collection_len || 0) + 1;
        };

        if (!Utils.is_empty(key) && !this.keys_not_avaible.includes(key) && Utils.is_empty(this.collection[key]))
            createValue(value, key);
        else {
            let newIndex = !Utils.is_empty(key) ? key + "_" : 0;
            let whileKey = 0;
            while (true) {
                whileKey += 1;
                if (Utils.is_empty(this.collection[newIndex + whileKey])) {
                    newIndex = newIndex + whileKey;
                    break;
                }
            }

            createValue(value, newIndex, key);
        }

        return this;
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
        return this.map((val, _) => {
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
                key = !Utils.is_empty(this.keyMap[key]) ? this.keyMap[key] : key;
                return Promise.resolve(func_(val.getValue(), key)).then(res => {
                    if (res)
                        collectionFiltered.add(val.getValue(), val.getKey());
                });
            });

            return Promise.all(tasks).then(() => collectionFiltered);
        });
    }

    map(func_, getValue = true) {
        const promises = this.collection.map((item, i) => {
            i = !Utils.is_empty(this.keyMap[item.getKey()]) ? this.keyMap[item.getKey()] : item.getKey(); 
            const resultFunc = func_(getValue ? item.getValue() : item, i);
            return resultFunc instanceof Promise ? resultFunc : Promise.resolve(resultFunc);
        });
        return Promise.all(promises).then(results => {

            const mapped = new Collection();
            for (let i = 0; i < results.length; i++) {
                const result = results[i];

                if (typeof result == "string" || !result)
                    if (!result || result.toLowerCase() == "continue") continue;
                    else if (result.toLowerCase() == "break") break;

                if (result instanceof TypeCollection)
                    mapped.add(result.getValue(), result.getKey());
                else
                    mapped.add(result, i ?? null);
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
            key = value_.getKey();
            return (value_.getValue()).indexOf(value) != -1;
        })

        this.collection.splice(index, 1);

        return this.synchronize();
    }

    get(key) {
        return new Promise(resolve => this.filter((value_, index) => {
            if (Utils.is_array(key)) {
                if (key.includes(value_.getKey()))
                    return true;
            } else
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
            return collect[index].toArray();
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
            const tasks = [];

            for (const key in resolvedArray) {
                const value = resolvedArray[key];
                tasks.push(() => this.add(Utils.is_array(value) ? Object.assign({}, value) : value, key));
            }

            return tasks.reduce((p, task) => { return p.then(() => task()) }, Promise.resolve()).then(() => {
                return this;
            });
        });
    }

    // createFromArrayObjects(array_) {
    //     Utils.validateArray(array_, 'array_');

    //     return Promise.resolve(array_).then(resolvedArray => {
    //         const tasks = [];
    //         for (const key in resolvedArray) {
    //             const value = resolvedArray[key];
    //             tasks.push(() => this.add(typeof value === "object" ? Object.assign({}, value) : value));
    //         }
    //         return tasks.reduce((p, v) => {
    //             return p.then(() => v())
    //         }, Promise.resolve()).then(() => {
    //             return this;
    //         });
    //     });

    // }

    static createFromArrayObjects(array_) {
        const collection = new Collection(array_);
        return collection;
    }

    valuesToArray() {
        const values = [];
        return this.map((val) => values.push(val)).then(() => values);
    }

    toArray() {
        return this.map(val => val.toArray(), false);
    }

    static toArray(collection) {
        if (collection instanceof Collection) {
            return collection.toArray();
        }
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

    toArray() {
        return { "key": this.getKey(), "value": this.getValue() };
    }
}
export default Collection;