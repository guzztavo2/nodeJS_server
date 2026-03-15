import File from '#core/filesystems/File.js'
import Directory from '#core/filesystems/Directory.js';
import dotenv from 'dotenv';
import Encrypt from '#core/support/Encrypt.js';
import Utils from '#core/support/Utils.js';

class Env {
   static env_example = new File('.env-example', './');
   static env_path = Directory.getAbsolutePath('./');
   static env_file = new File('.env', Env.env_path);
   env_configurations;

   init() {
      return Env.env_example.readData().then(data => {
         if (!Env.env_file.exists())
            return Env.env_file.create(data.toString()).then(_ => {
               if (!Env.env_file.exists())
                  throw Error("Not possible create env_file");
            }).then(_ => Promise.resolve(data));

         return Promise.resolve(data);
      }).then(data => Env.env_file.readData()
      .then(res => empty(res) ?
         Env.env_file.writeFile(data, false) : Promise.resolve())
         .then(_ => this.generateAppSecret())
         .then(_ => this.synchronizeDotEnv()))
         .then(_ => Promise.resolve(this.env_configurations));
   }

   generateAppSecret() {
      return Env.env_file.readData(true).then(data => this.getKeyFromEnvFile('APP_SECRET').then(value => {
         if (!value || value.length < 10) {
            data = data.replace('APP_SECRET=' + value, "APP_SECRET=" + Encrypt.generateString(40));
            return Env.env_file.writeFile(data, false).then(res => {
               if (!res)
                  throw new Error("Not possible to generate APP_SECRET in .env file");
            });
         }
      }));

   }

   getKeyFromEnvFile(key_to_find) {
      return Env.env_file.readData(true).then(data => {
         key_to_find += "="
         let aux = (data.substring(data.indexOf(key_to_find)));
         return aux.substring(key_to_find.length, aux.indexOf('\n')).trim();
      });
   }

   async updateEnvConfigurqations() {
      const envFinal = {};
      ((await Env.env_file.readData(true)).toString().split("\n")).map((val, _) => {
         const splited = ((val.trim()).split('=')).map(val => val.trim());
         envFinal[splited[0]] = splited[1];
      });

      return envFinal
   }

   synchronizeDotEnv() {
      this.env_configurations = {
         'APP_NAME': process.env.APP_NAME ?? null,
         'APP_SECRET': process.env.APP_SECRET ?? null,
         'APP_ENV': process.env.APP_ENV ?? null,
         'APP_DEBUG': process.env.APP_DEBUG ?? null,
         'APP_URL': process.env.APP_URL ?? null,
         'APP_PORT': process.env.APP_PORT ?? null,
         'DB_TYPE': process.env.DB_TYPE ?? null,
         'DB_HOST': process.env.DB_HOST ?? null,
         'DB_USERNAME': process.env.DB_USERNAME ?? null,
         'DB_PASSWORD': process.env.DB_PASSWORD ?? null,
         'DB_PORT': process.env.DB_PORT ?? null,
         'DB_NAME': process.env.DB_NAME ?? null,
         'LANGUAGE_': process.env.LANGUAGE_ ?? null
      }
      if (empty(this.env_configurations.APP_NAME) &&
         empty(this.env_configurations.APP_SECRET) &&
         empty(this.env_configurations.APP_URL) &&
         empty(this.env_configurations.APP_PORT) &&
         empty(this.env_configurations.DB_TYPE) &&
         empty(this.env_configurations.APP_DEBUG) &&
         empty(this.env_configurations.APP_ENV)) {
         Env.synchronizeDotEnv();
         return this.synchronizeDotEnv();
      }

   }

   getEnvConfigurations() {
      return this.env_configurations;
   }

   static synchronizeDotEnv() {
      dotenv.config({ path: Env.env_file.getAbsolutePath() });
   }
}

export default Env;