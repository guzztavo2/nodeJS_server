import fs from "fs";
import Path from "path";
import Utils from "./Utils.js";
import Directory from "./Directory.js";

class File {
    fileName;
    path;
    data;

    constructor(fileName, path = null) {
        this.setFileName(fileName);
        this.setPath(path);
    }

    getFileName() {
        return this.fileName;
    }

    getFileNameNoExt() {
        return this.fileName.substring(0, this.fileName.lastIndexOf('.'))
    }

    setFileName(fileName) {
        Utils.validateString(fileName, 'fileName');
        this.fileName = fileName;
    }

    getAbsolutePath() {
        return File.getAbsolutePath(this.getPath(), this.getFileName());
    }

    getRelativePath(){
        return File.getRelativePath(this.getAbsolutePath());
    }

    getPath() {
        return this.path;
    }

    setPath(path = null) {
        if(path)
            Utils.validateString(path, 'path');
        else
            path = "./";

        if (path.lastIndexOf(this.getFileName()) != -1)
            this.path = Directory.getAbsolutePath(path.substring(0, path.lastIndexOf(this.getFileName())));
        else
            this.path = Directory.getAbsolutePath(path);

    }

    readData(force = false) {
        if (!this.data || force) {
            return File.readData(this.getAbsolutePath())
                .then((res) => {
                    this.data = res;
                    return this.data;
                });
        }
        return Promise.resolve(this.data);
    }

    getData() {
        return this.data ?? false;
    }
    exists() {
        return File.fileExists(this.getAbsolutePath());
    }

    delete() {
        return File.delete(this.getAbsolutePath());
    }

    create(data = null) {
        this.data = data;
        return File.createFile(this.getAbsolutePath(), data)
            .then(data => {
                return this.data
            })
            .catch((err) => {
                this.data = null;
            });
    }

    writeFile(data, append = true) {
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

    static readData(path) {
        return (new Promise((res, rej) => {
            fs.readFile(path, "utf8", (err, data) => {
                if (err) rej(err);
                res(data);
            });
        }));
    }

    static delete(directory) {
        fs.unlinkSync(directory);
    }

    static createFile(path, data = null) {
        return (File.reWriteFile(path, data ?? ''));
    }

    static reWriteFile(path, data) {
        return new Promise((res, rej) => {
            fs.writeFile(path, data, { flag: 'w+' }, (err) => {
                if (err)
                    return rej("Não foi possivel criar o arquivo: " + err);
                res(true);
            });
        })
    }

    static appendWriteFile(path, data) {
        return new Promise((res, rej) => {
            fs.writeFile(path, data, { flag: 'a' }, (err) => {
                if (err)
                    return rej("Não foi possivel adicionar mais ao arquivo: " + err);
                res(true);
            });
        });

    }

    static fileExists(path) {
        return fs.existsSync(path);
    }

    static getAbsolutePath(path, filename) {
        return Directory.getAbsolutePath(path + Directory.PathSep + filename);
    }

    static getRelativePath(absolutePath, basePath = null){
        return Directory.getRelativePath(absolutePath, basePath)
    }
}

export default File;