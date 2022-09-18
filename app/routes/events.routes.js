const events = require('../controllers/events.controllers');
const authenticate = require('../middleware/authenticate');


module.exports = function (app) {

    app.route(app.rootUrl + '/events/categories')
        .get(events.get_categories);

    app.route(app.rootUrl + '/events')
        .get(events.view_events)
        .post(authenticate.loginRequired, events.add_event);

    app.route(app.rootUrl + '/events/:id')
        .get(events.get_event)
        .patch(authenticate.loginRequired, events.edit_event)
        .delete(authenticate.loginRequired, events.delete_event);
}