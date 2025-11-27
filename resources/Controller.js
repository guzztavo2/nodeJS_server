import Response from './Response.js';
import Env from './Env.js';
import Directory from './Directory.js';
class Controller {
    response;
    session;
    envConfig;

    async setConfigFile(request) {
        this.envConfig = await Env.init();
        this.envConfig.synchronizeDotEnv();
        this.response = new Response(request.session);
        this.session = request.session;
        if (this.title !== undefined)
            this.response.dataToFront = {
                'title': this.title
            }
        if (this.session.getByKey('responses') !== null &&
            Object.keys(this.session.getByKey('responses')).indexOf('data') !== -1) {
            this.response.dataToFront = Object.assign(this.response.dataToFront, this.session.getByKey('responses')['data']);
            this.session.deleteByKey('responses');
        }

        this.sessionDependencies(request);
        return this;
    }

    sessionDependencies(request) {
        const session = request.session.getByKey('responses') ?? {};

        session['before'] = session['actual'] ?? undefined;
        session['actual'] = request.actualUrl();

        request.session.create('responses', session)
    }

    static async findController(controller) {
        try {
            const mod = (await import(Directory.getAbsolutePath("./controllers/" + controller + ".js")));
            return mod.default || mod;
        }
        catch (err) {
            throw new Error(err);
        }
    }
}


export default Controller;