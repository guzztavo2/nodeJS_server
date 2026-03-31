import Response from '#core/http/Response.js';

class Controller {
    response;
    session;

    setConfigFile(request) {
        this.session = request.session;
        this.response = new Response(this.session);
        
        if (this.title !== undefined)
            this.response.dataToFront = {
                'title': this.title
            }
            
        if (!empty(this.session.getByKey('responses')) &&
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
}


export default Controller;