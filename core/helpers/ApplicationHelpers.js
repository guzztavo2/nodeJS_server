import Directory from "#core/filesystems/Directory.js";
import File from "#core/filesystems/File.js";
import Collection from "#core/support/Collection.js";
import Utils from "#core/support/Utils.js";
import Config from "#core/support/Config.js";
import Container from "#core/container/Container.js";

class ApplicationHelpers {

    static handle() {
        Utils.defineGlobal("DEFINE", (name, callback) => Utils.defineGlobal(name, callback));
        DEFINE("empty", (data) => Utils.isEmpty(data));
        DEFINE("Collection", (array) => new Collection(array));
        DEFINE("File", (file = null, path = null) => empty(file) && empty(path) ? File : new File(file, path));
        DEFINE("Directory", (directory) => empty(directory) ? Directory : new Directory(directory));
        DEFINE("Config", () => new Config());
        DEFINE("Container", () => Container);
    }
}

export default ApplicationHelpers;