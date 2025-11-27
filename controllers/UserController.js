import Controller from "../resources/Controller.js";
class userController extends Controller {

    constructor(configFile) {
        super(configFile);
    }

    async index(request) {
        return this.response.data('Hello user!', 200);
    }
}

export default userController;