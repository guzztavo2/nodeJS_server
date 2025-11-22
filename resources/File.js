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

    getAbsolutePath() {
        return Path.resolve(this.path, this.fileName);
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
        return (new Promise((res, error) => {
            fs.stat(fileDir, (err, stats) => {
                if (err)
                    error(err);
                else
                    res(stats.isFile())
            });
        })).then(res => { return res; })
            .catch(err => { throw err; });
    }

    static async readData(path) {
        return (new Promise((res, rej) => {
            fs.readFile(path, (err, data) => {
                if (err)
                    rej(err);
                else
                    res(data);
            })
        })).then(data => {
            return data;
        }).catch(err => {
            throw err;
        });
    }

    delete(directory) {
        fs.unlinkSync(directory);
    }

    static async createFile(path, data) {
        return (new Promise((res, err) => {
            try {
                res(fs.writeFileSync(path, data));
            } catch (e) {
                err(e);
            }
        })).then(() => {
            if (this.isFile(path))
                return true;
            return false;
        }).catch((e) => {
            throw new Error('Error creating file - ' + e.message);
        });

    }

    static fileExists(path) {
        return fs.existsSync(path);
    }
}

module.exports = File;