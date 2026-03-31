import Collection from "#core/support/Collection.js";
import File from "#core/filesystems/File.js";
import Utils from "#core/support/Utils.js";

class Container {
    static bindings = new Collection();
    static singletons = new Collection();
    static instances = new Collection();

    bind(key, factory) {
        Container.bind(key, factory);
    }

    singleton(key, factory) {
        Container.singleton(key, factory);
    }

    instance(key, factory) {
        Container.instance(key, factory);
    }

    make(key, ...args) {
        return Container.make(key, args);
    }

    static bind(key, factory) {
        Container.bindings.add(factory, key);
    }

    static singleton(key, factory) {
        Container.singletons.add(factory, key);
    }

    static instance(key, factory) {
        Container.instances.add(factory, key);
    }

    static make(key, ...args) {
        if (!Utils.isEmpty(args)) {
            if(args instanceof Array)
                args = Utils.filterEmptyArray(args);
                if (Utils.isEmpty(args))
                    args = [];
            args = args && args.length === 1 ? args[0] : args;
        }
        const executeAction = (execute, args) => {
            return (typeof execute == "function" ?
                !Utils.isEmpty(execute.name) ? new execute(args) :
                    execute(args) : execute) ?? true;
        };

        return Container.instances.get(key).then(instance => {
            if (instance)
                return executeAction(instance, args);

            return Container.singletons.get(key).then(singleton => {
                if (singleton) {
                    if (!instance) {
                        instance = executeAction(singleton, args);
                        Container.instance(key, instance);
                    }
                    return instance;
                }
                return Container.bindings.get(key).then(binding => {
                    if (binding)
                        return executeAction(binding, args);

                    if (typeof key == "function")
                        return new key(...args);

                    if (Utils.isString(key)) {
                        const file = new File(key);
                        if (file.exists()) {
                            return file.importJSFile().then(classFile => {
                                if (classFile) {
                                    instance = new classFile(args);
                                    Container.bind(key, classFile);
                                    return instance;
                                }
                            });
                        }
                    }
                });
            });
        }).then(resolve => {
            if (!resolve)
                throw new Error(`Binding '${key}' not found.`);
            return resolve;
        });
    }
}

export default Container;