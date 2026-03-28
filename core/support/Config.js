class Config{
   static config_file_path = "/config/config.json";
   static file;

   get(key){
      return Config.get(key);
   }
   
   static get(key){
      if(empty(Config.file))
         Config.file = File(Config.config_file_path);
      return Config.file.readData(true).then(file => {
         file = JSON.parse(file);
         return file[key] ?? false;
      });
   }
}
export default Config;