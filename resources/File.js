const fs = require('fs');
const Path = require('path');
const Promise = require('../resources/Promise');
const Utils = require('./Utils');

class File {
    fileName;
    path;

    constructor(fileName, path) {
        this.setFileName(fileName);
        this.setPath(path);
    }

    getFileName() {
        return this.fileName;
    }
    setFileName(fileName) {
        Utils.validateString(fileName, 'fileName');
        this.fileName = fileName;
    }

    getPath() {
        return this.path;
    }

    setPath(path) {
        Utils.validateString(path, 'path');
        this.path = path.substring(0, path.lastIndexOf(this.getFileName()));
    }

    static getActualProcessDir() {
        return Path.resolve(process.cwd());
    }

    static async isFile(fileDir) {
        let result = false;
        await (new Promise((res, error) => {
            fs.stat(fileDir, (err, stats) => {
                if (err)
                    error(err);
                else
                    res(stats.isFile())
            });
        })).then(res => { result = res; });
        return result;
    }

    static async readData(path) {
        let files_;

        await (new Promise((res, rej) => {
            fs.readFile(path, (err, data) => {
                if (err)
                    rej(err);
                else
                    res(data);
            })
        }).then(data => {
            files_ = data;
        }).catch(err => {
            throw err;
        }));

        return files_;
    }

    delete(directory) {
        fs.unlinkSync(directory);
    }

    static async createFile(path, data) {
        return (new Promise(fs.writeFileSync(path, data))).then(() => true).catch(() => false);
    }

    static fileExists(path) {
        return fs.existsSync(path);
    }
}

module.exports = File;