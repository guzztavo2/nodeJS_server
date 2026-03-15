import Controller from "#core/http/Controller.js";

class userController extends Controller {

    index(request) {
        return [
            () => header().push("item3", [1, 2, 3, 4]),
            () => header().push("item2", [1, 2, 3, 4]),
            () => header().push("item1", [1, 2, 3, 4]),
            () => header().push("item", [1, 2, 3, 4, 5])
        ].reduce((p, v) => {
            if (p instanceof Promise)
                return p.then(v());

            return p().then(v());

        }).then(() => header().remove("item"))
            .then(() => header().toArray().then(res => console.log(res)))
            .then(() => response().json("item2"));

        return response().addHeader("item1", [1, 2, 3, 4, 5, 6]).json("item2");
    }
}

export default userController;