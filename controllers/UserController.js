import Controller from "../resources/Controller.js";

class userController extends Controller {

    index(request) {
        return this.response.data("Hello world!");
    }
}

export default userController;