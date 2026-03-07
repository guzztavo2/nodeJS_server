import Server from "#core/http/Server.js";
import Env from '#core/support/Env.js';
import Container from "#core/container/Container.js";
import HttpKernel from "#core/kernel/HttpKernel.js";

import DatabaseProvider from "#core/providers/DatabaseProvider.js";
import HttpProvider from "#core/providers/HttpProvider.js";
// import ValidatorProvider from "#core/providers/ValidatorProvider.js";

class Application {
    
    static env_configurations = new Env();

    constructor() {
        this.container = new Container();
        this.registerProviders();

        this.httpKernel = new HttpKernel(this.container);
        this.server = new Server(this.httpKernel);

    }


    registerProviders() {
        [
            new DatabaseProvider(),
            new HttpProvider(),
            // new ValidatorProvider(),
        ].forEach(provider => {
            provider.register(this.container);
        });
    }

    startServer() {
        this.server.start();
    }

    stopServer() {
        this.server.stop();
    }

}
export default Application;