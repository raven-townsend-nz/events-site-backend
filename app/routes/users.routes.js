const users = require('../controllers/users.controller');
const authenticate = require('../middleware/authenticate');


module.exports = function (app) {
    app.route(app.rootUrl + '/users/register')
        .post(users.register_user);

    app.route(app.rootUrl + '/users/login')
        .post(authenticate.loggedOutRequired, users.login);

    app.route(app.rootUrl + '/users/logout')
        .post(authenticate.loginRequired, users.logout);

    app.route(app.rootUrl + '/users/:id')
        .get(users.get_user)
        .patch(authenticate.loginRequired, users.edit);
}