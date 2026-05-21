import WebSocket from "#core/websocket/WebSocket.js";
import Socket from "#core/websocket/connection/Socket.js";

class WebSocketHelpers {

    static handle() {
        DEFINE("websocket", () => WebSocket);
        DEFINE("socket", () => Socket);
    }
}

export default WebSocketHelpers;