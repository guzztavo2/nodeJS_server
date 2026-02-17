import Collection from "#core/support/Collection.js";

class Container {


    constructor() {
        this.bindings = new Collection();
        this.singletons = new Collection();
        this.instances = new Collection();
    }

    bind(key, factory) {
        return this.bindings.add(factory, key);
    }

    singleton(key, factory) {
        this.singletons.add(factory, key);
    }

    instance(key, factory) {
        this.instances.add(key, factory);
    }

    make(key, ...args) {
        this.instances.get(key).then(instance => {
            if (instance)
                return instance;

            return this.singletons.getByIndex(key).then(singleton => {
                if (singleton) {
                    if (!instance) {
                        const instance_ = singleton(this, ...args);
                        this.instance(key, instance_);
                    }
                    return instance;
                }
                return this.bindings.getByIndex(key).then(binding => {
                    return binding(this, ...args);
                });
            });

        }).then(resolve => {
            if (!resolve)
                throw new Error(`Binding '${key}' not found.`);
        });
    }
}

export default Container;