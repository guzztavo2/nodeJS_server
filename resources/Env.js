import File from './File.js'
import Directory from './Directory.js';
import dotenv from 'dotenv';
import Encrypt from './Encrypt.js';

class Env {
   static env_example = new File('.env-example', './');
   env_path = Directory.getAbsolutePath('./');
   env_file = new File('.env', this.env_path);
   envConfigurations;

   static async init() {
      const env = new Env();
      await env.checkEnv();
      await env.generateAppSecret();
      env.synchronizeDotEnv();
      return env;
   }

   async checkEnv() {
      if (!this.env_file.exists() || (await this.env_file.readData(true)).toString() == '') {
         let data = (await Env.env_example.readData()).toString();
         await this.env_file.create(data);
      }
   }

   async generateAppSecret() {
      try {
         let data = (await this.env_file.readData(true)).toString();
         const value = await this.getKeyFromEnvFile('APP_SECRET=');
         if (!value || value.length < 10) {
            data = data.replace('APP_SECRET=' + value, "APP_SECRET=" + Encrypt.generateString(40));
            if (!await this.env_file.writeFile(data, false))
               throw new Error("Not possible to generate APP_SECRET in .env file");
         }

      } catch (err) {
         throw new Error(err);
      }
   }

   async getKeyFromEnvFile(key_to_find) {
      const data = (await this.env_file.readData()).toString();
      let aux = (data.substring(data.indexOf(key_to_find)));
      return aux.substring(key_to_find.length, aux.indexOf('\n')).trim();
   }

   synchronizeDotEnv() {
      dotenv.config({ path: this.env_file.getAbsolutePath() });

      this.envConfigurations = {
         APP_NAME: process.env.APP_NAME,
         APP_SECRET: process.env.APP_SECRET,
         APP_URL: process.env.APP_URL,
         APP_PORT: process.env.APP_PORT,
         DB_TYPE: process.env.DB_TYPE,
         APP_DEBUG: process.env.APP_DEBUG == 'true' ? true : false,
         APP_ENV: process.env.APP_ENV
      };
   }

   getEnvConfigurations() {
      return this.envConfigurations;
   }
}

export default Env;