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
    route_directory = new Directory('routes', './routes');
    middleware_directory = new Directory('middlewares', './middlewares');
    cors_file = new File('cors.json', './config');
    routes = new Collection();
    

    async startServer() {
        this.createServer();
        await this.createConfigurations();
        await this.defineRoutes();
        await this.initConfigServer();
        // await this.migrationTable();
    }

    createServer() {
        if (Utils.is_empty(this.server))
            this.server = express();
        return this.server;
    }

    async createConfigurations() {
        this.env_configurations =  await Env.init();
    }

    expressSession() {
        this.server.use(express_session({
            secret: this.env_configurations.getEnvConfigurations().APP_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: this.env_configurations.getEnvConfigurations().APP_ENV === 'production' }
        }));
    }

    async defineRoutes() {
        this.expressSession();
        var isError = false;
        const routes_ = await this.readFilesRoutes();
        await this.getRoutes(routes_, (route) => {
            const controllerArray = typeof route.controller == 'string' && route.controller.length > 0 ? route.controller.split('::') : '';
            this.server[route.method](route.url, [upload.fields([])].concat(route.middlewares.toArray(),
                this.serverReceiveDataConfiguration()), async (req, res) => {
                    try {
                        const request = new Request(req, res);
                        const controller = (await (new (await Controller.findController(controllerArray[0]))()).setConfigFile(request));
                        const response = await controller[controllerArray[1]](request);
                        if (!Utils.is_empty(response))
                            response.renderResponse(res);
                    } catch (err) {
                        isError = !isError
                        Response.error(res, 404, err)
                    }
                });
        });
        await this.defineStorageRoutes();
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
            if(!value.is_recursive)
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

                        const resultFromDir = await getFilesUrl(await Directory.readDirectory(filePath), value, rootPath, filePath + "/");
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
                        ((new Response()).data(_FILE, 200)).renderResponse(res);
                    });
                }
        }
    }

    async getRoutes(routesFromFile, callback) {
        await routesFromFile.map(async (val, key) => {
            const key_ = val.getKey();
            let route = val.getValue();

            if (key_ !== 'web')
                if (route.url.length > 1)
                    route['url'] = '/' + key_ + route.url + '/';
                else
                    route['url'] = '/' + key_ + '/';

            route = await this.checkMiddlewares(route);
            callback(route);
        });
    }

    async checkMiddlewares(route) {
        const middlewares = new Collection();
        if (route.middlewares && route.middlewares.length > 0)
            for (const middleware_ of route.middlewares) {
                let middlewaresFiles = await this.middleware_directory.readDirectory();
                await (middlewaresFiles.filter(async (val) => val.getValue() instanceof File));
                await middlewaresFiles.map(async (val, key) => {
                    const mod = (await import(val.getValue().getAbsolutePath()));
                    const middleware = mod.default || mod;
                    if (middleware.identifier == middleware_)
                        middlewares.add(middleware.next);
                });
            }
        route.middlewares = middlewares;
        return route;
    }

    async readFilesRoutes() {
        const directory = await this.route_directory.readDirectory();
        await directory.filter(async (val) => val.getValue() instanceof File);
        await directory.map(async (val, key) => {
            const file = val.getValue();
            const route = file.getFileNameNoExt();
            if (route) {
                (await file.readData(true));
                this.routes.add(JSON.parse((file.getData()).toString())[0], route);
            }
        });

        return this.routes;
    }

    async findController(controller, request) {
        try {
            const mod = (await import(Directory.getAbsolutePath("./controllers/" + controller + ".js")));
            const controllerPage = mod.default || mod;
            return (await (new controllerPage()).setConfigFile(this.env_configurations.getEnvConfigurations(), request));
        }
        catch (err) {
            throw new Error(err);
        }
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
    async initConfigServer() {

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
        this.server.use(cors(JSON.parse(await this.cors_file.readData())));
        this.server.all('*', (req, res) => {
            Response.error(res, 404, 'Page Not Found');
        });
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

    async migrationTable() {
        try {
            const mysql = new MySql();
            const res = await mysql.verifyTableExist('migrations');
            const existMigration = res != 0;

            if (!existMigration)
                await mysql.createMigrationTable();
        } catch (err) {
            console.log(err);
        } return;
    }

}
export default App;