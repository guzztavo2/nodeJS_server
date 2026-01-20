import Server from "./resources/Server.js";
 

class App {
    server = new Server();

    constructor() {
         
    }

    startServer() {
        return this.server.start();
    }



}
export default App;