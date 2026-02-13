import Model from "#core/database/Model.js"

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