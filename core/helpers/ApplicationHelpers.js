import Directory from "#core/filesystems/Directory.js";
import File from "#core/filesystems/File.js";
import Collection from "#core/support/Collection.js";
import Utils from "#core/support/Utils.js";
import Config from "#core/support/Config.js";
import Container from "#core/container/Container.js";

class ApplicationHelpers {

    static handle() {
        ApplicationHelpers.defineContainer();
        ApplicationHelpers.defineFileSystem();
        DEFINE("empty", (data) => Utils.isEmpty(data));
        DEFINE("Collection", (array) => new Collection(array));
        DEFINE("isString", (val) => Utils.isString(val));
    }

    static defineContainer() {
        Utils.defineGlobal("DEFINE", (name, callback) => Utils.defineGlobal(name, callback));
        DEFINE("Container", () => Container);
        DEFINE("Config", (keys) => empty(keys) ? new Config() : Config.get(keys));
    }

    static defineFileSystem() {
        DEFINE("File", (fileName = null, path = null) => empty(fileName) && empty(path) ? (File) : new File(fileName, path));
        DEFINE("FromFile", (fileName, path) => File.from(fileName, path));
        DEFINE("Directory", (directory) => empty(directory) ? Directory : new Directory(directory));
    }
}

export default ApplicationHelpers;