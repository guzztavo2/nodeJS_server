
import pathToRegexp from "path-to-regexp";
import WebSocket from "#core/websocket/WebSocket.js";

class Router {
    static handleUpgrade(httpReq, httpSocket, head) {
        return Config().get(["websocket_", "websocket_routes", "websocket_maxPayload", "websocket_handshakeTimeoutMs"])
            .then(socketsConfigs => {
                if (!socketsConfigs['websocket_']) {
                    httpSocket.end(Router._errorResponse("Websocket inátivo"));
                    return;
                }

                const handShakeTimeOutMs = socketsConfigs["websocket_handshakeTimeoutMs"] || 5000;

                let handShakeDone = false;

                const timeout = setTimeout(() => {
                    if (!handShakeDone) {
                        try {
                            httpSocket.end(Router._errorResponse("Erro interno"));
                        } catch (e) { 
                            console.log(e);

                        }

                        try {
                            httpSocket.destroy();
                        } catch (e) { }
                    }

                }, handShakeTimeOutMs);

                try {
                    if (empty(httpReq.headers) || httpReq.headers['upgrade'] != 'websocket') {
                        httpSocket.end(Router._errorResponse("Upgrade inválido"));
                        return;
                    }
                    if (httpReq.headers['sec-websocket-version'] != '13') {
                        httpSocket.end(Router._errorResponse("Versão websocket não suportada"));
                        return;
                    }

                    const key = httpReq.headers['sec-websocket-key'];
                    if (empty(key)) {
                        httpSocket.end(Router._errorResponse("Sec-Websocket-Key ausente"));
                        return;
                    }

                    return Router._matchRoute(httpReq.url, socketsConfigs["websocket_routes"] || false).then(route => {
                        if (!route['controllerPath']) {
                            httpSocket.end(Router._errorResponse("Rota websocket não encontrada"));
                            return;
                        }
                        if (route['options'] && route['options']['auth']) {

                        }

                        return route['controllerPath'].importJSFile().then(controllerClass => {
                            const controller = new controllerClass();
                        });
                    }).catch(e => {
                        httpSocket.end(Router._errorResponse("Rota websocket não encontrada"));
                        return;
                    })

                } catch (e) {
                    console.log(e);
                }
                // console.log(socketsConfigs);
            })
    }

    static _errorResponse(error = "Upgrade de requisição não identificado") {
        return "HTTP/1.1 400 BadRequest\r\n" +
            "Content-Type: text/plain\r\n" + "Connection: close\r\n\r\n" + error;
    }

    static _acceptResponse(acceptKey) {
        return "HTTP/1.1 101 Switching Protocols\r\n" +
            "Upgrade: websocket\r\n" +
            "Connection: Upgrade\r\n" +
            `Sec-WebSocket-Accept: ${WebSocket.generateAcceptKey(acceptKey)}\r\n\r\n`;
    }

    static _routesFromFile(routesFile = false) {
        return new Promise((resolve, reject) => {
            if (empty(routesFile))
                return Config("websocket_routes").then(websocketRoutes =>
                    File(websocketRoutes).readData(true).then(data => resolve(JSON.parse(data))));
            else
                return FromFile(routesFile).readData(true).then(data => resolve(JSON.parse(data)));
        }).then(routes => {
            return Config('websocket_controller_directory').then(controllerPath => {
                return new Promise((resolve, reject) => {

                    for (const [key, val] of Object.entries(routes)) {
                        const file = FromFile(val['controller'], controllerPath);
                        if (!file)
                            return reject("File not found");
                        routes[key]['controller'] = file;
                    }
                   
                    console.log(routes);
                });


            });
        })
    }

    static _matchRoute(url, routesFile = false) {
        return Router._routesFromFile(routesFile).then(routes => {
            for (const r of routes)
                if (r.path === url)
                    return { controllerPath: FromFile(r.controller), options: r.options || {} };

            for (const r of routes)
                if (r.path.includes(":")) {
                    const keys = [];
                    const m = pathToRegexp(r.path, keys).exec(url);
                    if (m)
                        return { controllerPath: FromFile(r.controller), options: r.options || {} };
                }

            return { controllerPath: false, options: {} };
        })
    }

    static _authenticate(httpRequest, authOptions) {
        const url = new URL(httpRequest.url,)
    }
}

export default Router;