const fs = require('fs');
const Path = require('path');
class File {

    getActualProcessDir() {
        return Path.resolve(process.cwd());
    }
    static getActualProcessDir() {
        return (new File()).getActualProcessDir();
    }
    static directoryOrFile(fileDir) {
        return (new File()).directoryOrFile(fileDir);
    }
    directoryOrFile(fileDir) {
        return new Promise((res, err) => {
            fs.stat(fileDir, (err, stats) => {
                if (err) {
                    console.error(err);
                    return;
                }
                if (stats.isFile())
                    res('file')
                else if (stats.isDirectory())
                    res('directory')
                else
                    err(stats)
            });
        });
    }
    getDirPath(dir) {
        return Path.resolve(process.cwd(), dir);
    }
    static getDirPath(dir) {
        return (new File()).getDirPath(dir);
    }
    async readFilesFromDirectory(dir) {
        let files_;
        await new Promise((res) => {
            fs.readdir(dir, (err, files) => {
                if (err) throw err;
                res(files);
            });
        }).then(res => {
            files_ = res;
        });
        return files_;
    }
    static readFilesFromDirectory(dir) {
        return (new File()).readFilesFromDirectory(dir);
    }
    async readerFileDataToString(path) {
        let files_ = await this.readerFileData(path);
        
        return files_.toString();
    }
    static readerFileDataToString(path) {
        return (new File()).readerFileDataToString(path);
    }
    async readerFileData(path) {
        let files_;
        await new Promise((res) => {
            fs.readFile(path, (err, files) => {
                if (err) throw err;
                res(files);
            });
        }).then(res => {
            files_ = res;
        });
        
        return files_;
    }
    static readerFileData(path) {
        return (new File()).readerFileData(path);
    }

    delete(directory) {
        fs.unlinkSync(directory);
    }
    static delete(directory) {
        return (new File()).delete(directory);
    }
}



module.exports = File;