const fs = require('fs');
const Path = require('path');
const Promise = require('./Promise');
const Utils = require('./Utils');
const File = require('./File');
const Collection = require('./Collection');

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
        return Path.resolve(this.directory, this.path);
    }
    setDirectory(directory) {
        Utils.validateString(directory, 'directory');
        this.directory = directory;
    }
    setPath(path) {
        Utils.validateString(path, 'path');
        this.path = path;
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

    static async readDirectory(dir) {
        return (new Promise((res) => {
            fs.readdir(dir, (err, files) => {
                if (err) throw err;
                res(files);
            });
        })).then(async res => {
            const collection = new Collection();
            
            await Collection.createFromArrayObjects(res).map(async (val, key) => {
                const file = dir + "/" + val.getValue();
                if (file instanceof Directory || file instanceof File)
                    return "continue";

                const file_name = file.substring(file.lastIndexOf(Path.sep) + 1);

                if (await File.isFile(Directory.getAbsolutePath(file)))
                    collection.add(new File(file_name, Directory.getAbsolutePath(file)))
                else if (await Directory.isDirectory(Directory.getAbsolutePath(file)))
                    collection.add(new Directory(file_name, Directory.getAbsolutePath(file)));
                else
                    throw new Error('Unknown file system object: ' + file);
            });

            return collection;
        }).catch(err => {
            throw err;
        });
    }
}

module.exports = Directory;