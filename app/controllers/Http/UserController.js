import Controller from "#core/http/Controller.js";

class userController extends Controller {

    index(request) {
        return response().view("index");
    }
}

export default userController;