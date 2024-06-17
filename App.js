const express = require('express');
const Path = require('path');
const Request = require('./resources/Request');
const bodyParser = require('body-parser');
const multer = require('multer');
const MySql = require('./resources/MySql');
const upload = multer();
const Response = require('./resources/Response');
require('dotenv').config()
const compression = require("compression");
const File = require('./resources/File');
const express_session = require('express-session')

class App {
    listConfigurations;
    server;
    async startServer() {
        if (this.server == undefined)
            this.server = express();
        if (this.listConfigurations == undefined)
            this.listConfigurations = {
                APP_URL: process.env.APP_URL == '' || typeof process.env.APP_URL !== 'string' ? 'localhost' : process.env.APP_URL,
                APP_PORT: process.env.APP_PORT ?? 3000,
                DB_TYPE: process.env.DB_TYPE,
                APP_DEBUG: process.env.APP_DEBUG == 'true' ? true : false,
                APP_ENV: process.env.APP_ENV
            };

        try {
            await Promise.all([
                await this.defineRoutes(),
                this.initConfigServer(),
                this.migrationTable(),
            ]);
        } catch (error) {
            console.error(error);
        }
    }

    async defineRoutes() {
        var isError = false;

        this.server.use(express_session({
            secret: 'keyboard cat',
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false }
        }))

        const routes_ = await this.readFilesRoutes();
        await this.getRoutes(routes_, (route) => {
            const controllerArray = typeof route.controller == 'string' && route.controller.length > 0 ? route.controller.split('::') : '';
            this.server[route.method](route.url, [upload.fields([])].concat(route.middlewares, this.serverReceiveDataConfiguration()), async (req, res) => {
                try {
                    const request = new Request(req);
                    const controller = this.findController(controllerArray[0]);
                    const response = await controller[controllerArray[1]](request);
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
        const Storage = require('./resources/Storage');
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
        const keys = Object.keys(routesFromFile);
        for (const key of keys) {
            const routes = routesFromFile[key]
            for (let route of routes) {
                if (key !== 'web')
                    route['url'] = route.url + key + '/';
                route = await this.checkMiddlewares(route);
                callback(route);
            }
        }

    }
    async checkMiddlewares(route) {
        const middlewares = [];
        if (route.middlewares && route.middlewares.length > 0)
            for (const middleware_ of route.middlewares) {
                var pathMiddleware = File.getDirPath('middlewares');
                let middlewaresFiles = await File.readFilesFromDirectory(pathMiddleware);
                for (const value of middlewaresFiles) {
                    const middleware = require(pathMiddleware + '/' + value);
                    if (middleware.identifier == middleware_) {
                        middlewares.push(middleware.next);
                    }
                }
            }
        route.middlewares = middlewares;
        return route;
    }

    async readFilesRoutes() {
        var routePath = File.getDirPath('routes');
        const files = await File.readFilesFromDirectory(routePath);
        const routes = [];
        for (const file of files)
            if (file.substring(0, file.indexOf('.')) !== '')
                routes[file.substring(0, file.indexOf('.'))] = JSON.parse(await File.readerFileDataToString(Path.join('/', routePath + '/' + file)));


        return routes;
    }

    findController(controller) {
        try {
            const controllerPage = require('./controllers/' + controller);
            return (new controllerPage().setConfigFile(this.listConfigurations));
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
        this.server.set('views', Path.join(__dirname, '/views'));
        this.securityPass();
        this.requestLimiter();
        this.initCorsConfig();
        this.server.all('*', (req, res) => {
            Response.error(res, 404, 'Page Not Found');
        });
        this.server.listen(this.listConfigurations.APP_PORT, this.listConfigurations.APP_URL, (err) => {
            if (err)
                throw (err);
            console.log("Server Started\nhttp://" + this.listConfigurations.APP_URL + ":" + this.listConfigurations.APP_PORT);
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
        } catch (err) { } return;
    }

}
module.exports = App;