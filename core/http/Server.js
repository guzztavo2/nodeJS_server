import express from 'express';
import Request from '#core/http/Request.js';
import bodyParser from 'body-parser';
import multer from 'multer';
import MySql from '#core/database/MySql.js';
import Response from '#core/http/Response.js';
import compression from "compression";
import File from '#core/filesystems/File.js';
import Directory from '#core/filesystems/Directory.js';
import express_session from 'express-session';
import mime from 'mime-types';
import ejs from 'ejs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import RateLimit from "express-rate-limit";
import helmet from 'helmet';
import cors from 'cors';
import Utils from '#core/support/Utils.js';
import Log from '#core/support/Log.js';
import Application from '#core/Application.js';
import Route from "#core/http/Route.js";
import Config from '#core/support/Config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const upload = multer();

class Server {
    server;
    cors_file;
    server_listenner;
    connections = [];

    constructor(cors_file_path = './config/cors.json') {
        this.cors_file = new File(cors_file_path);
        this.route = new Route();
    }

    start() {
        this.create();
        [
            () => Application.env_configurations.init(),
            () => this.startRoutes(),
            () => this.initConfigServer(),
            () => this.migrationTable()
        ].reduce((p, v) => {
            return p.then(() => v())
        }, Promise.resolve()).then();
    }

    stop() {
        this.connections.forEach(curr => curr.destroy());
        this.server_listenner.closeAllConnections();
        this.server_listenner.closeIdleConnections()
        this.server_listenner.close();
        this.server.removeAllListeners();
    }

    create() {
        if (Utils.is_empty(this.server))
            this.server = express();
        return this.server;
    }

    expressSession() {
        this.server.use(express_session({
            secret: Application.env_configurations.getEnvConfigurations().APP_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: Application.env_configurations.getEnvConfigurations().APP_ENV === 'production' }
        }));
    }

    startRoutes() {
        this.expressSession();
        return this.route.defineRoutes(route => {
            if (Utils.is_empty(route.controller))
                var [controllerName, controllerMethod] = null;
            else
                var [controllerName, controllerMethod] = route.controller.split("::")

            this.server[route.method](route.url, [upload.fields([])].concat(route.middlewares.toArray()), (req, res) => {
                try {
                    const request = new Request(req, res);
                    return Config.get("controllers").then(controllerPath => {
                        const controllerFile = new File(controllerName + ".js", controllerPath);
                        return controllerFile.importJSFile().then(controller_ => {
                            const controller = (new controller_()).setConfigFile(request);

                            if (Utils.is_empty(controller[controllerMethod]))
                                return Response.error(res, 401, { "message": "Page not found", "title": "Erro!" });

                            const response = controller[controllerMethod](request);

                            if (response instanceof Promise)
                                response.then(response_ => {
                                    if (!Utils.is_empty(response_))
                                        response_.renderResponse(res);
                                }).catch(err => { throw err });
                            else
                                if (!Utils.is_empty(response))
                                    response.renderResponse(res);
                        });
                    });
                } catch (e) {
                    isError = !isError
                    Response.error(res, 404, err)
                }
            });
        }).then(() => this.route.storageRoutes()).then(files => {
            if (files && Utils.is_array(files))
                for (const file of files) {
                    this.server.get(file.file_url, [upload.fields([])], async (req, res) => {
                        res.setHeader('content-type', mime.lookup(file.file_path));
                        const _FILE = await File.readData(file.file_path);
                        ((new Response(req.session, res)).data(_FILE, 200)).renderResponse(res);
                    });
                }
        })
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

        this.serverReceiveDataConfiguration().forEach(el => this.server.use(el));
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

        this.server.use((err, req, res, next) => { Log.error(err.stack); res.status(500).send('Internal Server Error'); });

        this.server_listenner = this.server.listen(Application.env_configurations.getEnvConfigurations().APP_PORT,
            Application.env_configurations.getEnvConfigurations().APP_URL, (err) => {
                if (err)
                    throw (err);

                // setInterval(() => {
                //     Log.message("Server is running...");
                // }, 10000);
                Log.message("Server Started\nhttp://" + Application.env_configurations.getEnvConfigurations().APP_URL + ":" + Application.env_configurations.getEnvConfigurations().APP_PORT);
            });

        this.server_listenner.on('connection', (connection) => {
            this.connections.push(connection);
            connection.on('close', () => {
                this.connections = this.connections.filter(curr => curr !== connection);
            });
        });

        return Promise.resolve(true);
    }

    securityPass() {
        this.server.use(helmet.contentSecurityPolicy({
            directives: {
                "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
            }
        }));
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
        return mysql.verifyTableExist('migrations').then(res => {
            const existMigration = res != 0;
            if (!existMigration)
                mysql.createMigrationTable().then();
        }).catch(err => {
            throw err;
        })


    }
}
export default Server;