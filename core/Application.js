import Server from "#core/http/Server.js";
import Container from "#core/container/Container.js";
import HttpKernel from "#core/kernel/HttpKernel.js";
import Directory from "#core/filesystems/Directory.js";
import Config from "#core/support/Config.js";

import DatabaseProvider from "#core/providers/DatabaseProvider.js";
import HttpProvider from "#core/providers/HttpProvider.js";
import AppProvider from "#core/providers/AppProvider.js";

import ApplicationHelpers from "./helpers/ApplicationHelpers.js";
import HttpHelpers from "./helpers/HttpHelpers.js";
import WebSocketHelpers from "./helpers/WebSocketHelpers.js";

// import ValidatorProvider from "#core/providers/ValidatorProvider.js";

class Application {

    static Env;

    constructor() {
        this.container = new Container();
        this.registerProviders();
        this.httpKernel = new HttpKernel(this.container);
        this.container.singleton("httpKernel", this.httpKernel);

        this.promise = this.container.make("core/support/Env.js").then(env => {
            Application.Env = env;
            return env.init();
        }).then(() => this.initializeHelpers())
            .then(() => this);


    }

    env() {
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
        this.server = new Server(this.httpKernel);
        return this.ready().then(() => this.server.start());
    }

    stopServer() {
        this.server.stop();
    }

    initializeHelpers() {
        return Config.get(["helpers_directory", "helpers_list"]).then(configs => {
            return Directory.readDirectory(configs["helpers_directory"]).then(collectionFiles => {
                return collectionFiles.filter((val) => configs["helpers_list"].includes(val.getFileName())).then(collectionFiltered => {
                    return collectionFiltered.map(el => {
                        return el.importJSFile().then(file => {
                            file.handle();
                            return file;
                        })
                    })
                });
            });

        });
    }

}
export default Application;