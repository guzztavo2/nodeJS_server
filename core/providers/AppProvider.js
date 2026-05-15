import Env from "#core/support/Env.js";
import Config from "#core/support/Config.js";
import Encrypt from "#core/support/Encrypt.js";

class AppProvider {
    register(container) {
        container.singleton("Env", _ => new Env());
        container.bind("Config", Config);
        container.singleton("Encrypt", _ => new Encrypt());
    }
}

export default AppProvider;