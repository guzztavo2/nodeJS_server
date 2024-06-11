const File = require('./File');

class Storage {

    disks;
    directory;
   
    async disk(diskName) {
        await await this.setDisks();
        try {
            const disk = this.disks[diskName];
            if ([this.setDirectory(disk.root), this.setVisibility(disk.visibility)].includes(false))
                throw Error();
            return new Disk(this.directory, disk.url, disk.visibility, diskName);
        } catch (err) {
            console.log("Not possible use disk: " + diskName + "\naccess: " + File.getDirPath('./config/fileSystems.json'));
            return;
        }
    }

    async setDisks() {
        const result = await File.readerFileDataToString('config/fileSystems.json');
        this.disks = JSON.parse(result);
        return this.disks;
    }

    setDirectory(dir) {
        try {
            dir = dir.indexOf('/') == 0 ? dir.substring(1) : dir;
            dir = File.getDirPath(dir);
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir);
            this.directory = dir;
        }
        catch {
            console.log("Not possible create directory: " + dir);
            return false;
        }
        return true;
    }

    setVisibility(visibility) {
        if (visibility == "public" || visibility == "private") 
            return true;
        else
            return false;
    }

}
module.exports = Storage;

class Disk {
    directory
    url
    visibility
    name
    constructor(directory, url, visibility, name) {
        this.directory = directory + "/";
        this.url = url;
        this.visibility = visibility;
        this.name = name;
    }
    async listFilesFromDirectory(path = null) {
        let dir = path == null ? this.directory : this.directory + path;
        if (this.exists(dir) == false)
            return [];

        return await File.readFilesFromDirectory(dir);
    }

    exists(path) {
        path = path.indexOf(this.directory) !== -1 ? path.substring(this.directory.length) : path;
        return fs.existsSync(File.getDirPath(this.directory + "/" + path));
    }

    delete(path) {
        path = path.search(this.directory) !== -1 ? path : File.getDirPath(this.directory + path);

        if (this.exists(path)) {
            File.delete(path);
            return true;
        }
        return false;
    }

}