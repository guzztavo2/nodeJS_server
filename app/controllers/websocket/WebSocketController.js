import Controller from "#core/http/Controller.js";

class WebSocketController extends Controller {

    index(request) {
        this.validateWebSocket();
    }
}

export default WebSocketController;