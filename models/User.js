const Model = require("../resources/Model");

class User extends Model {
    table = 'user';

    fillable = [
        'id',
        'name',
        'email'
    ]

    hidden = [
        'password'
    ]

    cast = {
        "items": "object"
    }

}
export default User;