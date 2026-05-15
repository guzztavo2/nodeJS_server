

class Router{
    static handleUpgrade(httpReq, httpSocket, head){
        return Config().get(["websockets_", "websocket_routes", "websocket_maxPayload","websocket_handshakeTimeoutMs"])
        .then(socketsConfigs => {
            
        })
    }
}

export default Router;