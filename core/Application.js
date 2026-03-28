import Server from "#core/http/Server.js";
import Container from "#core/container/Container.js";
import HttpKernel from "#core/kernel/HttpKernel.js";

import DatabaseProvider from "#core/providers/DatabaseProvider.js";
import HttpProvider from "#core/providers/HttpProvider.js";
import AppProvider from "#core/providers/AppProvider.js";

import ApplicationHelpers from "./helpers/ApplicationHelpers.js";
import HttpHelpers from "./helpers/HttpHelpers.js";
// import ValidatorProvider from "#core/providers/ValidatorProvider.js";

class Application {

    static Env;

    constructor() {
        this.initializeHelpers();
        this.container = new Container();
        this.registerProviders();
        this.httpKernel = new HttpKernel(this.container);
        this.container.singleton("httpKernel", this.httpKernel);

        this.server = new Server(this.httpKernel);
        this.promise = this.container.make("core/support/Env.js").then(env => {
            Application.Env = env;
            return env.init();
        }).then(() => this);
    }

    env(){
        return Application.Env;
    }

    ready() {
        return this.promise;
    }

    registerProviders() {
        [
            new AppProvider(),
            new DatabaseProvider(),
            new HttpProvider(),
        ].forEach(provider => {
            provider.register(this.container);
        });
    }

    startServer() {
        return this.ready().then(() => this.server.start());
    }

    stopServer() {
        this.server.stop();
    }

    initializeHelpers() {
        [ApplicationHelpers, HttpHelpers].forEach(helper => helper.handle());
    }

}
export default Application;