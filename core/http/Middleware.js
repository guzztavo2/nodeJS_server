import Directory from "#core/filesystems/Directory.js";
import Request from "#core/http/Request.js";
import Config from "#core/support/Config.js";
import Collection from "#core/support/Collection.js";
import File from "#core/filesystems/File.js";

class Middleware {
    static middleware_directory;
    static initPromise;

    static ready() {
        return Config.get("middlewares").then(middlewarePath => {
            this.middleware_directory = new Directory(middlewarePath)
            return Promise.resolve(this);
        });
    }

    static checkMiddlewares(route) {
        return this.ready().then(middleware => {
            const middlewares = new Collection();

            if (!route.middlewares || route.middlewares.length === 0) {
                route.middlewares = middlewares;
                return Promise.resolve(route);
            }

            return this.middleware_directory.readRecursiveDirectory()
                .then(middlewaresFiles => middlewaresFiles.filter(val => val.getValue() instanceof File))
                .then(middlewaresFiles => {
                    const tasks = middlewaresFiles.collection.map(val => {
                        const file = val.getValue();

                        const imports = route.middlewares.map(identifier => {
                            if (route.middlewares instanceof Collection)
                                identifier = identifier.getKey();
                            return file.importJSFile().then(mod => {
                                const middleware = mod.default || mod;

                                if (middleware.identifier === identifier)
                                    middlewares.add(middleware.next.bind(middleware), middleware.identifier);
                            });
                        });
                        if (imports instanceof Array)
                            return Promise.all(imports);
                        else return imports;
                    });
                    return Promise.all(tasks).then(() => {
                        route.middlewares = middlewares;
                        return route;
                    });
                });
        })

    }

    next(request, response, next) {
        return this.handle(new Request(request, response), next);
    }
}
export default Middleware;