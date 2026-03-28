import express from 'express';
import multer from 'multer';
import Response from '#core/http/Response.js';
import compression from "compression";
import express_session from 'express-session';
import mime from 'mime-types';
import ejs from 'ejs';
import RateLimit from "express-rate-limit";
import helmet from 'helmet';
import cors from 'cors';
import Utils from '#core/support/Utils.js';
import Log from '#core/support/Log.js';
import Application from '#core/Application.js';
import Container from '#core/container/Container.js';

const upload = multer();

class Server {
    server;
    cors_file;
    server_listenner;
    connections = [];

    constructor(httpKernel, cors_file_path = './config/cors.json') {
        this.httpKernel = httpKernel;
        this.cors_file = File(cors_file_path);
        this.container = Container;
    }

    start() {
        [
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
        if (empty(this.server))
            this.server = express();

        this.serverReceiveDataConfiguration().forEach(el => this.server.use(el));
        this.server.engine('html', ejs.renderFile);
        this.server.use(compression());
        this.server.set('view engine', 'html');
        this.server.use('/public', express.static(Directory().getAbsolutePath('./public')));
        this.server.set('views', Directory().getAbsolutePath('./views'));
        this.securityPass();
        this.requestLimiter();
        return this.cors_file.readData().then(data => {
            this.server.use(cors(JSON.parse(data)));
        });
    }

    expressSession() {
        this.server.use(express_session({
            secret: Application.Env.getEnvConfigurations().APP_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: Application.Env.getEnvConfigurations().APP_ENV === 'production' }
        }));
    }

    initializeRoutes() {
        this.expressSession();
        return this.container.make("route").then(route =>
            this.route = route).then(() =>
                this.route.defineRoutes(route =>
                    route.middlewares.valuesToArray().then(middlewaresArray =>
                        this.server[route.method](route.url, [upload.fields([])].concat(middlewaresArray),
                            (httpRequest, httpResponse, httpNext) =>
                                Server.initializeHTTP(httpRequest, httpResponse).then(this.httpKernel.handle(route)))))
                    .then(() => this.route.storageRoutes()).then(files => {
                        if (files && Utils.isArray(files))
                            for (const file of files)
                                this.server.get(file.file_url, [upload.fields([])], async (httpRequest, httpResponse) => {
                                    httpResponse.setHeader('content-type', mime.lookup(file.file_path));
                                    const _FILE = await File().readData(file.file_path);
                                    return ((response(httpRequest.session)).data(_FILE, 200))
                                        .then(res => res.renderResponse(httpResponse))
                                });
                    })
            );
    }

    serverReceiveDataConfiguration() {
        return [
            express.json(),
            express.urlencoded({ extended: true }),
            upload.array()
        ];
    }

    static initializeHTTP(httpRequest = null, httpResponse = null) {
        if (!empty(httpRequest))
            return Container.make("httpRequest", httpRequest);
        else if (!empty(httpResponse))
            return Container.make("httpResponse", httpResponse);
    }

    serverUse(callback) {
        this.server.use((httpRequest, httpResponse, next) => {
            return Server.initializeHTTP(httpRequest, httpResponse).then(() => callback(httpRequest, httpResponse, next));
        });
    }

    serverUseError(callback) {
        this.server.use((err, httpRequest, httpResponse, next) => {
            return Server.initializeHTTP(httpRequest, httpResponse).then(() => callback(err, httpRequest, httpResponse, next));
        });
    }

    initConfigServer() {
        this.serverUse(() => {
            Log.error("Page not found");
            Response.error(404, 'Page Not Found')
        })
        this.serverUseError((err, httpRequest, httpResponse) => {
            Log.error(err.stack || err);
            Response.error(500, { "title": "Internal Server Error" });
        })

        this.server_listenner = this.server.listen(Application.Env.getEnvConfigurations().APP_PORT,
            Application.Env.getEnvConfigurations().APP_URL, (err) => {
                if (err) throw (err);

                Log.log("Server Started | http://" + Application.Env.getEnvConfigurations().APP_URL + ":" + Application.Env.getEnvConfigurations().APP_PORT);
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
        return this.container.make("Config")
            .then(config => config.get("requestLimiter").then(requestLimiter => this.server.use(RateLimit({
                windowMs: requestLimiter['windowMs'],
                max: requestLimiter['max']
            }))));
    }

    migrationTable() {
        return this.container.make("db").then(db => {
            return db.verifyTableExist('migrations').then(res => {
                const existMigration = res != 0;
                if (!existMigration)
                    return db.createMigrationTable();
            }).catch(err => {
                throw err;
            })
        });

    }
}
export default Server;