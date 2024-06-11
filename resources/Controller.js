const Response = require('./Response.js');
class Controller {
    configFile = []
    response;


    constructor(configFile) {
        this.configFile = configFile;
        this.response = new Response();
    }

}

module.exports = Controller;