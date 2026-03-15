import File from "#core/filesystems/File.js";

class Config{
   static file = new File("config.json", "/config");

   get(key){
      return Config.get(key);
   }
   
   static get(key){
      return this.file.readData(true).then(file => {
         file = JSON.parse(file);
         return file[key] ?? false;
      });
   }
}
export default Config;