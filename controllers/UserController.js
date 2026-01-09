import Controller from "../resources/Controller.js";
import Storage from "../resources/Storage.js";
class userController extends Controller {

    constructor(configFile) {
        super(configFile);
    }

    index(request) {
        const disk = Storage.disk("public").then(res => {
            res.listFilesFromDirectory().then(files => {
                console.log(files);
            })
        });
        return this.response.data('Hello user!', 200);
    }
}

export default userController;