const images = require('../controllers/users.images.controllers');
const authenticate = require('../middleware/authenticate');


module.exports = function (app) {

    app.route(app.rootUrl + '/users/:id/image')
        .get(images.get_image)
        .put(authenticate.loginRequired, images.put_image)
        .delete(authenticate.loginRequired, images.delete_image);
}