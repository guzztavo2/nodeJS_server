import fs from 'fs';
import Path from 'path';
import Promise from '../resources/Promise.js';
import Utils from './Utils.js';
import Directory from './Directory.js';

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
        return File.getAbsolutePath(this.getPath(), this.getFileName());
    }

    getPath() {
        return this.path;
    }

    setPath(path) {
        Utils.validateString(path, 'path');
        this.path = Directory.getAbsolutePath(path.substring(0, path.lastIndexOf(this.getFileName())));
    }

    readData() {
        return File.readData(this.getAbsolutePath());
    }

    exists() {
        return File.fileExists(this.getAbsolutePath());
    }

    delete() {
        return File.delete(this.getAbsolutePath());
    }

    create(data = null) {
        return File.createFile(this.getAbsolutePath(), data);
    }

    writeFile(data, flag = 'a+') {
        return File.writeFile(this.getAbsolutePath(), data, flag);
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

    static delete(directory) {
        fs.unlinkSync(directory);
    }

    static async createFile(path, data = null) {
        return File.reWriteFile(path, data ?? '').then(() => {
            if (this.isFile(path))
                return true;
            return false;
        }).catch((e) => {
            throw new Error('Error creating file - ' + e.message);
        });
    }

    static async reWriteFile(path, data) {
        return new Promise((res, rej) => {
            try {
                fs.writeFile(path, data, { flag: 'w+' });
                res(true);
            } catch (e) {
                rej(e);
            }
        });
    }

    static async appendWriteFile(path, data) {
        return new Promise((res, rej) => {
            try {
                fs.writeFile(path, data, { flag: 'a' });
                res(true);
            } catch (e) {
                rej(e);
            }
        });
    }

    static fileExists(path) {
        return fs.existsSync(path);
    }

    static getAbsolutePath(path, filename) {
        return Path.resolve(path, filename);
    }
}

export default File;