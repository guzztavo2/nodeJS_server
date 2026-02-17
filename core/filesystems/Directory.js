import fs from 'fs';
import Path from 'path';
import Utils from '#core/support/Utils.js';
import File from '#core/filesystems/File.js';
import Collection from '#core/support/Collection.js';
import path from 'path';

class Directory {
    directory;
    path;
    static PathSep = path.sep;

    constructor(directory) {
        this.setDirectory(directory);
    }

    getDirectory() {
        return this.directory;
    }

    getPath() {
        return this.path;
    }

    getAbsolutePath() {
        const path = this.getPath() ?? ".";
        return Directory.getAbsolutePath(path + Directory.PathSep + this.getDirectory());
    }

    getRelativePath() {
        return Directory.getRelativePath(this.getAbsolutePath());
    }

    setDirectory(directory) {
        Utils.validateString(directory, 'directory');

        if (directory == "./")
            directory = Directory.getAbsolutePath(directory)

        const directorySplitted = directory.split('/');

        if (directorySplitted.filter(val => val && val.length > 1).length == 1) {
            this.directory = directory;
            this.setPath(this.getAbsolutePath());
        } else {
            this.directory = directorySplitted.pop();
            this.setPath(Directory.getAbsolutePath(directorySplitted.join('/')));
        }
    }

    readDirectory() {
        return Directory.readDirectory(this.getAbsolutePath());
    }

    readRecursiveDirectory() {
        return Directory.readRecursiveDirectory(this.getAbsolutePath());
    }

    setPath(path = null) {
        if (path)
            Utils.validateString(path, 'path');

        path = Directory.getAbsolutePath(path ?? './');
        if (!Directory.exists(path))
            throw Error("Path not exists: " + path);

        this.path = path;
        if (this.directory == "/" || !this.directory) {
            if (this.path.substring(this.path.lastIndexOf('/')) == "/") {
                const aux = (this.path.substring(0, this.path.lastIndexOf('/')));
                this.path = (aux.substring(0, aux.lastIndexOf('/') + 1))
                this.directory = aux.substring(aux.lastIndexOf('/') + 1);
            } else {
                this.directory = this.path.substring(this.path.lastIndexOf('/') + 1);
                this.path = this.path.substring(0, this.path.lastIndexOf('/') + 1);
            }
        } else {
            if (Directory.getAbsolutePath('./' + this.directory) == Directory.getAbsolutePath(this.path))
                this.path = this.path.substring(0, this.path.lastIndexOf('/') + 1);

        }
    }

    isDirectory() {
        return Directory.isDirectory(this.getAbsolutePath());
    }

    static async isDirectory(fileDir) {
        return (new Promise((res, error) => {
            fs.stat(fileDir, (err, stats) => {
                if (err)
                    error(err);
                else
                    res(stats.isDirectory())
            });
        })).then(res => { return res; }).catch(err => { throw err; });
    }

    static getAbsolutePath(dir = "./") {
        const actualProcessDir = File.getActualProcessDir();
        if ((dir[0] === "/") && actualProcessDir.split("/")[1] != dir.split("/")[1])
            dir = actualProcessDir + dir;
        return Path.resolve(process.cwd(), dir);
    }

    static getRelativePath(absolute, base = null) {
        if (!base)
            base = process.cwd();

        return path.relative(base, absolute);
    }

    static exists(directory) {
        return fs.existsSync(directory) ?? false;
    }

    static readDirectory(directory) {
        if (!Directory.exists(directory))
            return Promise.reject("Not exists");
        return new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) return reject(err);

                const collection = new Collection();

                const tasks = files.map(val => {
                    const file = directory + Directory.PathSep + val;
                    const file_name = file.substring(file.lastIndexOf(Directory.PathSep) + 1);
                    const absPath = Directory.getAbsolutePath(file);

                    return File.isFile(absPath).then(isFile => {
                        if (isFile)
                            return collection.add(new File(file_name, absPath));
                        else
                            return Directory.isDirectory(absPath).then(isDirectory => {
                                if (isDirectory)
                                   return collection.add(new Directory(absPath));

                            });
                    });
                });

                Promise.all(tasks).then(() => resolve(collection));
            });
        });
    }

    static readRecursiveDirectory(directory) {
        if (!Directory.exists(directory))
            return Promise.reject("Not exists");

        return new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) return reject(err);

                const collection = new Collection();

                const tasks = files.map(val => {
                    const file = directory + Directory.PathSep + val;
                    const file_name = file.substring(file.lastIndexOf(Directory.PathSep) + 1);
                    const absPath = Directory.getAbsolutePath(file);

                    return File.isFile(absPath).then(isFile => {
                        if (isFile) {
                            collection.add(new File(file_name, absPath));
                            return;
                        }
                        return Directory.isDirectory(absPath).then(isDirectory => {
                            if (isDirectory) {
                                collection.add(new Directory(absPath));
                                return Directory.readRecursiveDirectory(absPath).then(subCollection => {
                                    subCollection.collection.map(subVal => {
                                        collection.add(subVal.getValue());
                                    });
                                });
                            }
                        });
                    });
                });

                Promise.all(tasks).then(() => resolve(collection));
            });
        });
    }
    static makeDirectories(path, recursive = false) {
        return new Promise((res, rej) => {
            fs.mkdir(path, { recursive: recursive }, err => {
                if (err)
                    return rej(err);
                res(new Directory(path.substring(path.lastIndexOf(Directory.PathSep)), path.substring(0, path.lastIndexOf(Directory.PathSep))));
            });
        })

    }
}

export default Directory;