import Utils from "./Utils.js";
import Promise from "#core/support/Promise.js";
import Log from "#core/support/Log.js";
import readline from "readline";
import Application from "#core/Application.js";
import { resolve } from "dns";
import { fork } from "node:child_process";

class Cli {
    arguments = [];

    static application = new Application();
    static shouldExit = true;

    constructor() {
        if (Cli.getArguments().includes("silent"))
            Log.executeConsoleLog = false;

        Cli.prepareEnv().then(() => {
            this.arguments = process.argv;
            return Promise.checkPromise(this.beforeHandle()).then((res_) => {
                return Promise.checkPromise(this.handle(res_)).then(() => {
                    if (Cli.shouldExit)
                        Cli.exit("CLI process finished.");
                }).catch(err => {
                    Cli.logError(`CLI process failed: ${err}`);
                }).finally((res) => Promise.checkPromise(this.afterHandle(res_)));
            }).catch(err_ => {
                Cli.logError(`CLI process failed: ${err_}`);
            }).finally(() => {
                if (Cli.shouldExit)
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
        const lastIndexOf = param.lastIndexOf(Directory().PathSep);
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
    static runningProcessChild(file, params = []) {
        return new Promise((resolve, reject) => {
            const child = fork(file.getAbsolutePath(), params, { execArgv: [] });

            let output = '';
            child.on('message', msg => output += msg);
            child.on('error', reject);
            child.on('exit', code => {
                if (code !== 0) reject(new Error(`Child exited with code ${code}`));
                else resolve(output);
            });
        });
    }
    static getArguments(index) {
        if (index)
            return process.argv[index] || false;
        else
            return process.argv;
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
        if (!Utils.isString(str))
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
        return this.application.ready().then(() => this.application.env());
    }

    static log(message, showDateTime = true) {
        Log.message(message, showDateTime);
    }

    static error(message) {
        Log.error(message);
    }

    static readLine(question = "") {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            return rl.question(question, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }

    static readLines(questions = []) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const answers = [];
        let index = 0;

        return new Promise((resolve) => {
            const askQuestion = () => {
                if (index < questions.length) {
                    rl.question(questions[index], (answer) => {
                        answers.push(answer);
                        index++;
                        askQuestion();
                    });
                } else {
                    rl.close();
                    resolve(answers);
                }
            };
            askQuestion();
        });
    }

    static clearConsole() {
        Log.write('\x1Bc');
    }

    static readKey(callback) {
        return new Promise((resolve, reject) => {
            const StartStdin = () => {
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.setEncoding("utf8");
                process.stdin.on("data", beforeHandler);
            }

            const StopStdin = () => {
                process.stdin.removeListener("data", beforeHandler);
                process.stdin.setRawMode(false);
                process.stdin.pause();
            }
            const beforeHandler = (key) => {
                if (key === "\u001b") {
                    StopStdin();
                    Cli.exit("Escape key pressed, exiting...");
                    return;
                }

                const keyTransformed = callback(key);
                StopStdin();
                if (!keyTransformed)
                    return reject(key);
                resolve(keyTransformed);
            };

            StartStdin();
        });

    }

    static write(message, showDateTime = false, textColor = "", backgroundColor = "") {
        Log.write(message, showDateTime, textColor, backgroundColor)
    }

    static consoleClear() {
        Log.write('\x1Bc');
    }

    static setCursor(line, col = null) {
        if (line && !col)
            Log.write(`\x1b[${line}`);
        else
            Log.write(`\x1b[${line};${col}H`);
    }
}

export default Cli;