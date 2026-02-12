import Server from "./http/Server.js";
import Env from './support/Env.js';

class Application {
    server = new Server();
    
    static env_configurations = new Env();
    constructor() {
         
    }

    startServer() {
        this.server.start();
    }

    stopServer() {
        this.server.stop();
    }

}
export default Application;