import Controller from "../resources/Controller.js";
import Storage from "../resources/Storage.js";

class userController extends Controller {

    index(request) {
        return this.response.data("Hello world!");
    }
}

export default userController;