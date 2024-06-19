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
        this.sessionDependencies(request);
        return this;
    }

    sessionDependencies(request) {
        const session = request.session.getByKey('responses') ?? {};

        session['before'] = session['actual'] ?? undefined;
        session['actual'] = request.getByKey('url').value;

        request.session.create('responses', session)
    }
}


module.exports = Controller;