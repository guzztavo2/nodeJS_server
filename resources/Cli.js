import DateTime from "./DateTime.js";
import Env from "./Env.js";
import Utils from "./Utils.js";
import Directory from "./Directory.js";
import Promise from "./Promise.js";
import Log from "./Log.js";

class Cli {
    arguments = [];

    constructor() {
        Cli.prepareEnv().then(() => {
            this.arguments = process.argv;
            return Promise.checkPromise(this.beforeHandle()).then((res_) => {
                return Promise.checkPromise(this.handle(res_)).then(() => {
                    Cli.exit("CLI process finished.");
                }).catch(err => {
                    Cli.logError(`CLI process failed: ${err}`);
                }).finally((res) => Promise.checkPromise(this.afterHandle(res_)));
            }).catch(err_ => {
                Cli.logError(`CLI process failed: ${err_}`);
            }).finally(() => {
                Cli.exit();
            });
        }).catch(err => {
            Cli.exitError(`Failed to prepare environment: ${err}`);
        });
    }

    beforeHandle() {
        Cli.log("Before handling CLI process...");
    }

    afterHandle() {
        Cli.log("After handling CLI process...");
    }

    getPathFromParam(param) {
        const lastIndexOf = param.lastIndexOf(Directory.PathSep);
        if (lastIndexOf !== -1) {
            let name = param.substring(lastIndexOf + 1);
            let path = param.substring(0, lastIndexOf + 1);
            if (!name) {
                name = param.substring(param.indexOf("/") + 1, lastIndexOf);
                path = param.substring(0, param.lastIndexOf(name));
            }
            return [path, Cli.stringTreatment(name)];
        }
        return [null, param];
    }

    static getArguments(index) {
        return process.argv[index] || false;
    }

    static exit(message = null, code = null) {
        !message || Log.message(message);
        process.exit(code);
    }

    static exitError(message = null, code = null) {
        !message || Log.error(message);
        process.exit(code);
    }

    static stringTreatment(str, trim = true, replaceArr = [{ "key": "val" }] || null) {
        if (!Utils.is_string(str))
            return Log.error("The value must be a string");
        if (trim) {
            str = str.trim();
            str = str.replaceAll(' ', '_');
        }

        if (!replaceArr || !(replaceArr.length == 1 && (replaceArr[0]["key"] && replaceArr[0]["key"] === "val")))
            for (const obj of replaceArr) {
                const key = Object.keys(obj)[0];
                const value = Object.values(obj)[0];
                str = str.replaceAll(key, value);
            }
        return str;
    }

    static prepareEnv() {
        return (new Env()).init();
    }

    static log(message) {
        Log.message(message);
    }
    
    static error(message) {
        Log.error(message);
    }
}

export default Cli;