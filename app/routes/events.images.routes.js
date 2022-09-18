const images = require('../controllers/events.images.controllers');
const authenticate = require('../middleware/authenticate');


module.exports = function (app) {

    app.route(app.rootUrl + '/events/:id/image')
        .get(images.get_image)
        .put(authenticate.loginRequired, images.put_image);
}