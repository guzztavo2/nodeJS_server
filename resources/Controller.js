const Response = require('./Response.js');
class Controller {
    configFile = []
    response;
    session;
    setConfigFile(configFile, request) {
        this.configFile = configFile;
        this.response = new Response(request.session);
        this.session = request.session;
        if (this.title !== undefined)
            this.response.dataToFront = {
                'title': this.title
            }
        if (this.session.getByKey('responses') !== null && Object.keys(this.session.getByKey('responses')).indexOf('data') !== -1) {
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
}


module.exports = Controller;