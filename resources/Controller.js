const Response = require('./Response.js');
class Controller {
    configFile = []
    response;

    setConfigFile(configFile) {
        this.configFile = configFile;
        this.response = new Response();
        if(this.title !== undefined)
        this.response.dataToFront = {
            'title': this.title
        }
        return this;
    }
}

module.exports = Controller;