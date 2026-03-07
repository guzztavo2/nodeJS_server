import express from 'express';
import Request from '#core/http/Request.js';
import multer from 'multer';
import MySql from '#core/database/MySql.js';
import Response from '#core/http/Response.js';
import compression from "compression";
import File from '#core/filesystems/File.js';
import Directory from '#core/filesystems/Directory.js';
import express_session from 'express-session';
import mime from 'mime-types';
import ejs from 'ejs';
import RateLimit from "express-rate-limit";
import helmet from 'helmet';
import cors from 'cors';
import Utils from '#core/support/Utils.js';
import Log from '#core/support/Log.js';
import Application from '#core/Application.js';
import Route from "#core/http/Route.js";

const upload = multer();

class Server {
    server;
    cors_file;
    server_listenner;
    connections = [];

    constructor(httpKernel, cors_file_path = './config/cors.json') {
        this.httpKernel = httpKernel;
        this.cors_file = new File(cors_file_path);
        this.route = new Route();
    }

    start() {
        [
            () => Application.env_configurations.init(),
            () => this.create(),
            () => this.initializeRoutes(),
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

    initializeRoutes() {
        this.expressSession();
        return this.route.defineRoutes(route => {
            return route.middlewares.valuesToArray().then(middlewaresArray =>
                this.server[route.method](route.url, [upload.fields([])].concat(middlewaresArray), (httpRequest, httpResponse, httpNext) => {
                    Server.initializeHTTP(httpRequest, httpResponse);
                    this.httpKernel.handle(route, httpRequest, httpResponse);
                })
            );
        }).then(() => this.route.storageRoutes()).then(files => {
            if (files && Utils.is_array(files))
                for (const file of files) {
                    this.server.get(file.file_url, [upload.fields([])], async (httpRequest, httpResponse) => {
                        httpResponse.setHeader('content-type', mime.lookup(file.file_path));
                        const _FILE = await File.readData(file.file_path);
                        ((new Response(httpRequest.session, httpResponse)).data(_FILE, 200)).renderResponse(httpResponse);
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

    static initializeHTTP(httpRequest = null, httpResponse = null){        
        if(!Utils.is_empty(httpRequest))
            Request.httpRequest = httpRequest;
        if(!Utils.is_empty(httpResponse))
            Response.httpResponse = httpResponse;    
    } 

    serverUse(callback) {
        this.server.use((httpRequest, httpResponse, next) => {
            Server.initializeHTTP(httpRequest, httpResponse);
            return callback(httpRequest, httpResponse, next);
        });
    }

    serverUseError(callback) {
        this.server.use((err, httpRequest, httpResponse, next) => {
            Server.initializeHTTP(httpRequest, httpResponse);
            return callback(err, httpRequest, httpResponse, next);
        });
    }

    initConfigServer() {
        this.serverUse(() => Response.error(404, 'Page Not Found'))
        this.serverUseError((err, httpRequest, httpResponse) => {
            Log.error(err.stack);
            Response.error(500, { "title": "Internal Server Error" });
        })

        this.server_listenner = this.server.listen(Application.env_configurations.getEnvConfigurations().APP_PORT,
            Application.env_configurations.getEnvConfigurations().APP_URL, (err) => {
                if (err) throw (err);

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