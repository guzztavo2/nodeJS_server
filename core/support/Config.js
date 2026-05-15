import Utils from '#core/support/Utils.js';

class Config {
   static config_file_path = "/config/config.json";
   static file;
   static data_file;

   get(keys) {
      return Config.get(keys);
   }

   static get(keys, force = false) {
      if (empty(Config.file))
         Config.file = File(Config.config_file_path);
      if (Config.data_file & !force) {
         return new Promise((resolve, reject) => {
            if (Utils.isArray(keys))
               return resolve(keys.reduce((acc, key_) => {
                  if (!empty(Config.data_file[key_]))
                     acc[key_] = Config.data_file[key_]
                  return acc;
               }, {}));

            return resolve(Config.data_file[keys]);
         })

      }

      return Config.file.readData(true).then(file => {
         Config.data_file = file;
         file = JSON.parse(file);
         if (Utils.isArray(keys))
            return keys.reduce((acc, key_) => {
               if (!empty(file[key_])) {
                  acc[key_] = file[key_];
               }
               return acc;
            }, {});

         return file[keys] ?? false;
      });
   }
}
export default Config;