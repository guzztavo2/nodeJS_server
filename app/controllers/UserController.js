import Controller from "../../core/http/Controller.js";

class userController extends Controller {

    index(request) {
        return this.response.data("Hello world!");
    }
}

export default userController;