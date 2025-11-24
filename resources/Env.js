import File from './File.js'
import Directory from './Directory.js';
import dotenv from 'dotenv';
class Env {
   static env_example = new File('.env-example', './');
   env_path = Directory.getAbsolutePath('./');
   env_file = new File('.env', this.env_path);
   envConfigurations;

   static async init(){
      const env = new Env();
      await env.checkEnv();
      await env.generateAppSecret();
      env.synchronizeDotEnv();
      return env;
   }

   async checkEnv() {
      if (!this.env_file.exists()) {
         let data = (await Env.env_example.readData()).toString();
         this.env_file.create(data);
      }
   }

   async generateAppSecret() {
      let data = await this.env_file.readData();
      data = data.replace('APP_SECRET=', "APP_SECRET=" + Encrypt.generateString(40));
      await this.env_file.reWriteFile(data);
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
}

export default Env;