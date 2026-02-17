import File from "#core/filesystems/File.js";

class Config{
   static file = new File("config.json", "/config");

   static get(key){
      return this.file.readData(true).then(file => {
         file = JSON.parse(file);
         return file[key] ?? false;
      });
   }
}
export default Config;