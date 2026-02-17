import Directory from "#core/filesystems/Directory.js";
import File from "#core/filesystems/File.js";
import Config from "#core/support/Config.js";
import Collection from "#core/support/Collection.js";
import Middleware from "#core/http/Middleware.js";
import Storage from "#core/filesystems/Storage.js";
import Utils from "#core/support/Utils.js";

class Route {
    directory;
    routes = new Collection();

    constructor() {
        this.initPromise = Config.get("routes").then(route => {
            this.directory = new Directory(route);
        }).then(_ => this.readFilesRoutes()).then(_ => this);
    }

    ready() {
        return this.initPromise;
    }

    readFilesRoutes() {
        return this.routes.ready().then(() => {
            return this.directory.readDirectory()
                .then(collection => collection.getLength()
                    .then(len => {
                        if (len == 0)
                            return false;
                        return collection;
                    }))
                .then(collection => collection.filter(val => val.getValue() instanceof File))
                .then(collection => {
                    const tasks = collection.map(val => {
                        const file = val.getValue();
                        const route = file.getFileNameNoExt();

                        if (!route) return Promise.resolve();

                        return file.readData(true).then(data => {
                            return this.routes.add(JSON.parse(data), route)
                        });
                    });

                    return Promise.resolve(tasks).then(() => this.routes);
                })
        });
    }

    defineRoutes(callback) {
        return this.ready().then(_ => this.getRoutes(this.routes, callback));
    }

    getRoutes(routesFromFile, callback) {
        return routesFromFile.map((val) => {
            const key = val.getKey();
            const route_s = val.getValue();
            
            if (Utils.is_array(route_s)) {
                const tasks = [];
                for (const route_ of route_s) {
                    if (key !== 'web')
                        if (route_.url.length > 1)
                            route_['url'] = '/' + key + route_.url + '/';
                        else
                            route_['url'] = '/' + key + '/';
                    tasks.push(Middleware.checkMiddlewares(route_).then(route => callback(route)));
                }
                return Promise.all(tasks);
            } else
                if (key !== 'web')
                    if (route_s.url.length > 1)
                        route_s['url'] = '/' + key + route_s.url + '/';
                    else
                        route_s['url'] = '/' + key + '/';



            return Middleware.checkMiddlewares(route_s).then(route => callback(route));
        });
    }

    async storageRoutes() {
        const storage = new Storage();
        const disks = await storage.setDisks();

        for (const name in disks) {
            const value = disks[name]

            if (value.visibility !== 'public')
                continue;

            const rootPath = Directory.getAbsolutePath(value.root);
            let files = await Directory.readDirectory(rootPath);
            if (!value.is_recursive)
                files = await files.filter((value) => value.getValue() instanceof File);

            const getFilesUrl = async (files, value, rootPath, filePath_ = null) => {
                let response = [];
                if (files.length <= 0)
                    return false;
                await files.map(async (val) => {
                    let filePath;
                    const file = val.getValue();

                    if (file instanceof File) {
                        if (filePath_ !== null)
                            filePath = Directory.getAbsolutePath(filePath_ + Directory.PathSep + file.getFileName());
                        else
                            filePath = Directory.getAbsolutePath(rootPath + Directory.PathSep + file.getFileName());

                        const file_url = filePath.replace(rootPath, '');
                        response = response.concat({ file_url: encodeURI(file_url), file_path: filePath });
                    } else if (file instanceof Directory) {
                        if (filePath_ !== null)
                            filePath = Directory.getAbsolutePath(filePath_ + Directory.PathSep + file.getDirectory());
                        else
                            filePath = Directory.getAbsolutePath(rootPath + Directory.PathSep + file.getDirectory());

                        const resultFromDir = await getFilesUrl(await Directory.readDirectory(filePath), value, rootPath, filePath + Directory.PathSep);
                        if (resultFromDir)
                            response = response.concat(resultFromDir);
                    }
                });
                return response;
            };

            return await getFilesUrl(files, value, rootPath);
        }
    }
}
export default Route;