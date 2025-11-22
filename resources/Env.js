import File from './File.js'
import Directory from './Directory.js';

class Env{
 static env_example = new File('.env-example', './');
 env_path = Directory.getAbsolutePath('./');
 env_file = new File('.env', this.env_path);

 constructor(){
    this.checkEnv();
 }

 async checkEnv(){
    if (!this.env_file.exists()) {
        let data = (await Env.env_example.readData()).toString();
        data = data.replace('APP_SECRET=', "APP_SECRET=" + Encrypt.generateString(40));
        await this.env_file.create();
    }
 }

}

export default Env;