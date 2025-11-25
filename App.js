import express from 'express';
import Path from 'path';
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
const upload = multer();

class App {
    envConfigurations;
    server;
    routeDirectory = new Directory('routes', './routes');
    middlewareDirectory = new Directory('middlewares', './middlewares');
    routes = new Collection();

    async startServer() {
        this.createServer();
        await this.createConfigurations();
        await this.defineRoutes();
        this.initConfigServer();
        await this.migrationTable();
    }

    createServer() {
        if (this.server == undefined)
            this.server = express();
        return this.server;
    }

    async createConfigurations() {
        this.envConfigurations = await Env.init();
    }

    expressSession() {
        this.server.use(express_session({
            secret: this.envConfigurations.getEnvConfigurations().APP_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: this.envConfigurations.getEnvConfigurations().APP_ENV === 'production' }
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
                        const controller = this.findController(controllerArray[0], request);
                        const response = await controller[controllerArray[1]](request);
                        if (typeof response !== 'undefined' && response !== undefined)
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
        const mime = require('mime-types');

        const storage = new Storage();
        const disks = await storage.setDisks();

        for (const name in disks) {
            const value = disks[name]

            if (value.visibility !== 'public')
                continue;

            const rootPath = File.getActualProcessDir() + File.getDirPath(value.root) + '/'
            const files = await File.readFilesFromDirectory(rootPath)

            const getFilesUrl = async (files, value, rootPath, filePath_ = null) => {
                let response = [];
                if (files.length <= 0)
                    return false;

                for (const file of files) {
                    let filePath;
                    if (filePath_ !== null)
                        filePath = File.getDirPath(filePath_ + file);
                    else
                        filePath = File.getDirPath(rootPath + file);

                    switch (await File.directoryOrFile(filePath)) {
                        case 'directory':
                            const resultFromDir = await getFilesUrl(await File.readFilesFromDirectory(filePath), value, rootPath, filePath + "/");
                            if (resultFromDir !== false)
                                response = response.concat(resultFromDir);
                            break;
                        case 'file':
                            const file_url = filePath.replace(rootPath, '/')
                            response = response.concat({ file_url: file_url, file_path: filePath });
                            break
                    }
                }
                return response;
            };
            const filesUrl = await getFilesUrl(files, value, rootPath);
            if (filesUrl !== false)
                for (const file of filesUrl) {
                    this.server.get(file.file_url, [upload.fields([])], async (req, res) => {
                        res.setHeader('content-type', mime.lookup(file.file_path));
                        const _FILE = await File.readerFileData(file.file_path);
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
        const keys = Object.keys(routesFromFile.toArray());
        for (const key of keys) {
            const routes = routesFromFile[key]

        }
    }

    async checkMiddlewares(route) {
        const middlewares = new Collection();
        if (route.middlewares && route.middlewares.length > 0)
            for (const middleware_ of route.middlewares) {
                let middlewaresFiles = await this.middlewareDirectory.readDirectory();
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
        const directory = await this.routeDirectory.readDirectory();
        await directory.filter(async (val) => val.getValue() instanceof File);

        await directory.map(async (val, key) => {
            const file = val.getValue();
            const route = file.getFileName().substring(0, file.getFileName().indexOf('.'));
            if (route)
                this.routes.add(JSON.parse(await file.readData())[0], route);
        });

        return this.routes;
    }

    findController(controller, request) {
        try {
            const controllerPage = require('./controllers/' + controller);
            return (new controllerPage()).setConfigFile(this.envConfigurations, request);
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
    initConfigServer() {

        this.serverReceiveDataConfiguration().forEach(el => {
            this.server.use(el)
        });

        this.server.engine('html', require('ejs').renderFile);
        this.server.use(compression());
        this.server.set('view engine', 'html');
        this.server.use('/public', express.static(Path.join(__dirname, 'public')));
        this.server.use(express.json());
        this.server.set('views', Path.join(__dirname, '/views'));
        // this.server.use(this.generateCsrfToken);
        this.securityPass();
        this.requestLimiter();
        this.initCorsConfig();
        this.server.all('*', (req, res) => {
            Response.error(res, 404, 'Page Not Found');
        });
        this.server.listen(this.envConfigurations.APP_PORT, this.envConfigurations.APP_URL, (err) => {
            if (err)
                throw (err);
            console.log("Server Started\nhttp://" + this.envConfigurations.APP_URL + ":" + this.envConfigurations.APP_PORT);
        });

    }

    async initCorsConfig() {
        const cors = require('cors');
        this.server.use(cors(JSON.parse(await File.readerFileDataToString(File.getDirPath('config') + '/cors.json'))));
    }
    securityPass() {
        const helmet = require("helmet");

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
        const RateLimit = require("express-rate-limit");

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