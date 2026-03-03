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
        [
            () => Application.env_configurations.init(),
            () => this.create(),
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

        this.serverReceiveDataConfiguration().forEach(el => this.server.use(el));
        this.server.engine('html', ejs.renderFile);
        this.server.use(compression());
        this.server.set('view engine', 'html');
        this.server.use('/public', express.static(Directory.getAbsolutePath('./public')));
        this.server.set('views', Directory.getAbsolutePath('./views'));
        this.securityPass();
        this.requestLimiter();
        return this.cors_file.readData().then(data => {
            this.server.use(cors(JSON.parse(data)));
        });
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
            const renderError = (http_code = 404, err = null) => {
                Response.error(http_code, err)
            };
            return route.middlewares.valuesToArray().then(middlewaresArray => {
                this.server[route.method](route.url, [upload.fields([])].concat(middlewaresArray), (req, res) => {
                    const request = new Request(req);
                    return Config.get("controllers").then(controllerPath => {
                        const controllerFile = new File(controllerName + ".js", controllerPath);
                        return controllerFile.importJSFile().then(controller_ => {

                            const controller = (new controller_()).setConfigFile(request);

                            if (Utils.is_empty(controller[controllerMethod]))
                                return Response.error(401, { "message": "Page not found", "title": "Erro!" });

                            const response = controller[controllerMethod](request);

                            if (response instanceof Promise)
                                response.then(response_ => {
                                    if (!Utils.is_empty(response_) && !Utils.is_empty(response_.renderResponse))
                                        response_.renderResponse(res);
                                    else
                                        throw new Error("Response not defined");
                                }).catch(err => {
                                    throw err
                                });
                            else
                                if (!Utils.is_empty(response) && !Utils.is_empty(response.renderResponse))
                                    response.renderResponse(res);
                                else
                                    // throw new Error("Response not defined");
                                    Response.data(response).renderResponse();
                        }).catch(err => {
                            Log.error(err);
                            return renderError(500, err);
                        });
                    });
                });
            })

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
            express.json(),
            express.urlencoded({ extended: true }),
            upload.array()
        ];
    }

    initConfigServer() {
        this.server.use((req, res) => {
            Response.error(res, 404, 'Page Not Found');
        });

        this.server.use((err, req, res, next) => { Log.error(err.stack); res.status(500).send('Internal Server Error'); });

        this.server_listenner = this.server.listen(Application.env_configurations.getEnvConfigurations().APP_PORT,
            Application.env_configurations.getEnvConfigurations().APP_URL, (err) => {
                if (err)
                    throw (err);

                Log.log("Server Started | http://" + Application.env_configurations.getEnvConfigurations().APP_URL + ":" + Application.env_configurations.getEnvConfigurations().APP_PORT);
            });

        this.server_listenner.on('connection', (connection) => {
            this.connections.push(connection);
            connection.on('close', () => {
                this.connections = this.connections.filter(curr => curr !== connection);
            });
        });

        return Promise.resolve(this);
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