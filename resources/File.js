import fs from 'fs';
import Path from 'path';
import Promise from '../resources/Promise.js';
import Utils from './Utils.js';
import Directory from './Directory.js';

class File {
    fileName;
    path;
    data;

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

    async readData(force = false) {
        if (!this.data || force)
            this.data = await File.readData(this.getAbsolutePath());
        return this.data;
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

    async writeFile(data, append = true) {
        if (append)
            return File.appendWriteFile(this.getAbsolutePath(), data);
        else
            return File.reWriteFile(this.getAbsolutePath(), data);
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
        await (File.reWriteFile(path, data ?? ''));
        this.data = data;
        return this.isFile(path);
    }

    static reWriteFile(path, data) {
        return new Promise((res, rej) => {
            fs.writeFile(path, data, { flag: 'w+' }, (err) => {
                if (err)
                    rej("Não foi possivel criar o arquivo: " + err);
                res(true);
            });
        })
    }

    static appendWriteFile(path, data) {
        return new Promise((res, rej) => {
        fs.writeFile(path, data, { flag: 'a' }, (err) => {
            if (err)
                rej("Não foi possivel adicionar mais ao arquivo: " + err);
            res(true);
        });
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