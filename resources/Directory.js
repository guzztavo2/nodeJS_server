import fs, { Dir } from 'fs';
import Path, { resolve } from 'path';
import Utils from './Utils.js';
import File from './File.js';
import Collection from './Collection.js';

class Directory {
    directory;
    path;

    constructor(directory, path) {
        this.setDirectory(directory);
        this.setPath(path.substring(0, path.lastIndexOf(Path.sep) + 1));
    }

    getDirectory() {
        return this.directory;
    }

    getPath() {
        return this.path;
    }

    getAbsolutePath() {
        return Path.resolve(this.path, this.directory);
    }

    setDirectory(directory) {
        Utils.validateString(directory, 'directory');
        this.directory = directory;
    }

    readDirectory() {
        return Directory.readDirectory(this.getAbsolutePath());
    }

    setPath(path) {
        Utils.validateString(path, 'path');
        this.path = Directory.getAbsolutePath(path);
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

    static getAbsolutePath(dir) {
        return Path.resolve(process.cwd(), dir);
    }

    static readDirectory(directory) {
        return new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) return reject(err);

                const collection = new Collection();
                
                const tasks = files.map(val => {
                    const file = directory + "/" + val;
                    const file_name = file.substring(file.lastIndexOf(Path.sep) + 1);
                    const absPath = Directory.getAbsolutePath(file);

                    return File.isFile(absPath).then(isFile => {
                        if (isFile) {
                            collection.add(new File(file_name, absPath));
                            return;
                        }
                        return Directory.isDirectory(absPath).then(isDirectory => {
                            if (isDirectory) {
                                collection.add(new Directory(file_name, absPath));
                            }
                        });
                    });
                });

                Promise.all(tasks).then(() => resolve(collection));
            });
        });
    }
}

export default Directory;