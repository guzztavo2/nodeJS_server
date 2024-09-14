class Collection {
    collection = [];

    add(key, value) {
        return this.collection.push((new typeCollection(key, value)));
    }
    map(func_){
        return this.toArray().map(func_);
    }
    removeByKey(key) {
        const index = this.collection.findIndex((value) => {
            return (value.getKey()).indexOf(key) != -1;
        })

        this.collection.splice(index, 1);

        return this;
    }
    removeByValue(value) {
        const index = this.collection.findIndex((value_) => {
            return (value_.getValue()).indexOf(value) != -1;
        })

        this.collection.splice(index, 1);
        return this;
    }

    findByKey(key) {
        return this.collection.filter((value_) => {
            return (String(value_.getKey())).indexOf(key) != -1;
        })
    }
    findByValue(valueFind) {
        if(typeof valueFind == 'function')
            return this.collection.filter(valueFind);
        return this.collection.filter((value_, index_) => {
            const value = value_.getValue();

            if (typeof value == 'object') {
                for (const [key_, value_] of Object.entries(value_.getValue()))

                    if ((String(value_)).indexOf(valueFind) != -1)
                        return value_;
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
        array_.map(value => {
            const index = (this.add(this.collection.length, Object.assign({}, value)) - 1);
            this[index] = this.collection[index].getValue();
        })
    }

    static createFromArrayObjects(array_) {
        const collection = new Collection();
        collection.createFromArrayObjects(array_);
        return collection;
    }

    toArray() {
        return this.collection.map(val => {
            return Object.values(val)[1];
        })
    }

    static toArray(collection){
        return collection.toArray();
    }
}

class typeCollection {
    key; value;

    constructor(key = null, value = null) {
        if (key != null)
            this.key = key;

        if (value != null)
            this.value = value;
    }


    setKey(key) {
        this.key = key;
    }

    getKey() {
        return this.key;
    }

    setValue(value) {
        this.value = value;
    }

    getValue() {
        return this.value;
    }


}
module.exports = Collection;