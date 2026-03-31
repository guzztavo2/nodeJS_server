import Env from "#core/support/Env.js";
import Config from "#core/support/Config.js";

class AppProvider {
    register(container) {
        container.singleton("Env", () => new Env());
        container.bind("Config", Config);
    }
}

export default AppProvider;