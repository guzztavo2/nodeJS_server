import express from 'express';
import Request from './resources/Request.js';
import bodyParser from 'body-parser';
import multer from 'multer';
import MySql from './resources/MySql.js';
import Response from './resources/Response.js';
import compression from "compression";
import File from './resources/File.js';
import Directory from './resources/Directory.js';
import express_session from 'express-session';
import Collection from './resources/Collection.js';
import Env from './resources/Env.js';
import Storage from './resources/Storage.js';
import mime from 'mime-types';
import ejs from 'ejs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import RateLimit from "express-rate-limit";
import helmet from 'helmet';
import cors from 'cors';
import Controller from './resources/Controller.js';
import Utils from './resources/Utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const upload = multer();

class App {
    env_configurations;
    server;
    route_directory;
    middleware_directory;
    cors_file;
    routes;

    constructor() {
        this.env_configurations = new Env();
        this.route_directory = new Directory('./routes');
        this.middleware_directory = new Directory('./middlewares');
        this.cors_file = new File('cors.json', './config');
        this.routes = new Collection();
    }

    startServer() {
        this.createServer();
        return this.env_configurations.init().then(() => {

            return this.defineRoutes();
        }).then(() => { this.initConfigServer(), this.migrationTable() });
    }

    createServer() {
        if (Utils.is_empty(this.server))
            this.server = express();
        return this.server;
    }

    expressSession() {
        return this.env_configurations.init().then(_ => this.server.use(express_session({
            secret: this.env_configurations.getEnvConfigurations().APP_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: this.env_configurations.getEnvConfigurations().APP_ENV === 'production' }
        })));
    }

    defineRoutes() {
        return this.expressSession().then(() => {
            var isError = false;
            return this.readFilesRoutes().then(routes => this.getRoutes(routes, (route) => {
                const controllerArray = typeof route.controller == 'string' && route.controller.length > 0 ? route.controller.split('::') : '';
                this.server[route.method](route.url, [upload.fields([])].concat(route.middlewares.toArray(),
                    this.serverReceiveDataConfiguration()), (req, res) => {
                        try {
                            const request = new Request(req, res);
                            const controllerFile = new File(controllerArray[0] + ".js", "./controllers");
                            (File.importJSFile(controllerFile.getAbsolutePath())).then(controller_ => {
                                const controller = (new controller_()).setConfigFile(request);
                                const response = controller[controllerArray[1]](request);

                                if (response instanceof Promise)
                                    response.then(response_ => {
                                        if (!Utils.is_empty(response_))
                                            response_.renderResponse(res);
                                    }).catch(err => { throw err });
                                else
                                    if (!Utils.is_empty(response))
                                        response.renderResponse(res);
                            })
                        } catch (err) {
                            isError = !isError
                            Response.error(res, 404, err)
                        }
                    });
            }));

        });
    }

    async defineStorageRoutes() {
        const storage = new Storage();
        const disks = await storage.setDisks();

        for (const name in disks) {
            const value = disks[name]

            if (value.visibility !== 'public')
                continue;

            const rootPath = File.getActualProcessDir() + Directory.getAbsolutePath(value.root) + '/'
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
                            filePath = Directory.getAbsolutePath(filePath_ + file.getFileName());
                        else
                            filePath = Directory.getAbsolutePath(rootPath + file.getFileName());

                        const file_url = filePath.replace(rootPath, '/')
                        response = response.concat({ file_url: encodeURI(file_url), file_path: filePath });
                    } else if (file instanceof Directory) {
                        if (filePath_ !== null)
                            filePath = Directory.getAbsolutePath(filePath_ + file.getDirectory());
                        else
                            filePath = Directory.getAbsolutePath(rootPath + file.getDirectory());

                        const resultFromDir = await getFilesUrl(await Directory.readDirectory(filePath), value, rootPath, filePath + Directory.PathSep);
                        if (resultFromDir)
                            response = response.concat(resultFromDir);
                    }
                });
                return response;
            };

            const filesUrl = await getFilesUrl(files, value, rootPath);
            if (filesUrl !== false)
                for (const file of filesUrl) {
                    this.server.get(file.file_url, [upload.fields([])], async (req, res) => {
                        res.setHeader('content-type', mime.lookup(file.file_path));
                        const _FILE = await File.readData(file.file_path);
                        ((new Response(req.session, res)).data(_FILE, 200)).renderResponse(res);
                    });
                }
        }
    }

    getRoutes(routesFromFile, callback) {
        return routesFromFile.map((val) => {
            const key = val.getKey();
            const route_ = val.getValue();

            if (key !== 'web')
                if (route_.url.length > 1)
                    route_['url'] = '/' + key + route_.url + '/';
                else
                    route_['url'] = '/' + key + '/';

            return this.checkMiddlewares(route_).then(route => callback(route));
        });
    }

    checkMiddlewares(route) {
        const middlewares = new Collection();

        if (!route.middlewares || route.middlewares.length === 0) {
            route.middlewares = middlewares;
            return Promise.resolve(route);
        }

        return this.middleware_directory.readRecursiveDirectory().then(middlewaresFiles =>
            middlewaresFiles.filter(val => val.getValue() instanceof File)).then(middlewaresFiles => {

                const tasks = middlewaresFiles.collection.map(val => {
                    const file = val.getValue();
                    const abs = file.getAbsolutePath();

                    const imports = route.middlewares.map(identifier => {

                        return File.importJSFile(abs).then(mod => {
                            const middleware = mod.default || mod;

                            if (middleware.identifier === identifier)
                                middlewares.add(middleware.next.bind(middleware));
                        });
                    });

                    return Promise.all(imports);
                });
                return Promise.all(tasks).then(() => {
                    route.middlewares = middlewares;
                    return route;
                });
            });
    }

    readFilesRoutes() {
        return this.route_directory.readDirectory().then(collection => collection.filter(val => val.getValue() instanceof File))
            .then(collection => {
                const tasks = collection.map(val => {
                    const file = val.getValue();
                    const route = file.getFileNameNoExt();

                    if (!route) return Promise.resolve();

                    return file.readData(true).then(data => {
                        this.routes.add(JSON.parse(data)[0], route);
                    });
                });

                return Promise.resolve(tasks).then(() => this.routes);
            });
    }

    serverReceiveDataConfiguration() {
        return [
            bodyParser.json(),
            upload.array(),
            bodyParser.urlencoded({
                extended: false
            })
        ];
    }
    initConfigServer() {

        this.serverReceiveDataConfiguration().forEach(el => {
            this.server.use(el)
        });

        this.server.engine('html', ejs.renderFile);
        this.server.use(compression());
        this.server.set('view engine', 'html');
        this.server.use('/public', express.static(Directory.getAbsolutePath('./public')));
        this.server.use(express.json());
        this.server.set('views', Directory.getAbsolutePath('./views'));
        this.securityPass();
        this.requestLimiter();
        this.cors_file.readData().then(data => {
            this.server.use(cors(JSON.parse(data)));
        });

        this.server.use((req, res) => {
            Response.error(res, 404, 'Page Not Found');
        });

        this.server.use((err, req, res, next) => { console.error(err.stack); res.status(500).send('Internal Server Error'); });

        this.server.listen(this.env_configurations.getEnvConfigurations().APP_PORT, this.env_configurations.getEnvConfigurations().APP_URL, (err) => {
            if (err)
                throw (err);
            console.log("Server Started\nhttp://" + this.env_configurations.getEnvConfigurations().APP_URL + ":" + this.env_configurations.getEnvConfigurations().APP_PORT);
        });

    }

    securityPass() {
        this.server.use(helmet.contentSecurityPolicy({
            directives: {
                "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
            }
        }),);
        this.server.use(helmet.frameguard({ action: 'deny' }));
        this.server.use(helmet.xssFilter());
        this.server.use(helmet.referrerPolicy({ policy: 'same-origin' }));
    }

    requestLimiter() {
        this.server.use(RateLimit({
            windowMs: 1 * 60 * 1000,
            max: 20,
        }));
    }

    migrationTable() {
        const mysql = new MySql();
        mysql.verifyTableExist('migrations').then(res => {
            const existMigration = res != 0;
            if (!existMigration)
                mysql.createMigrationTable().then();
        }).catch(err => {
            throw err;
        })


    }
}
export default App;