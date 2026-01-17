import Directory from './Directory.js';
import File from './File.js';
import Log from './Log.js';

class Storage {

    disks;
    directory;
    fileSystems = new File('fileSystems.json', './config/')

    async disk(diskName) {
        await this.setDisks();
        try {
            const disk = this.disks[diskName];
            if ([this.setDirectory(disk.root), this.setVisibility(disk.visibility)].includes(false))
                throw Error('');
            return new Disk(this.directory, disk.url, disk.visibility, diskName);
        } catch (err) {
            Log.error("Not possible use disk: " + diskName + "\naccess: " + Directory.getAbsolutePath('./config/fileSystems.json'));
            return;
        }
    }

    async setDisks() {
        const result = (await this.fileSystems.readData(true)).toString();
        this.disks = JSON.parse(result);
        return this.disks;
    }

    setDirectory(dir) {
        this.directory = new Directory(dir);
        return true;
    }

    static disk(name) {
        return (new Storage()).disk(name);
    }
    
    setVisibility(visibility) {
        if (visibility == "public" || visibility == "private")
            return true;
        else
            return false;
    }

}
export default Storage;

class Disk {
    directory
    url
    visibility
    name
    constructor(directory, url, visibility, name) {
        this.directory = directory;
        this.url = url;
        this.visibility = visibility;
        this.name = name;
    }
    async listFilesFromDirectory(path = null) {
        let dir = path == null ? this.directory : this.directory.setPath(this.directory.getAbsolutePath() + path);
        if (!(await dir.isDirectory()))
            return [];

        return await dir.readDirectory();
    }

    exists(path) {
        path = path.indexOf(this.directory) !== -1 ? path.substring(this.directory.length) : path;
        return fs.existsSync(Directory.getAbsolutePath(this.directory + Directory.PathSep + path));
    }

    delete(path) {
        path = path.search(this.directory) !== -1 ? path : Directory.getAbsolutePath(this.directory + path);

        if (this.exists(path)) {
            File.delete(path);
            return true;
        }
        return false;
    }

}