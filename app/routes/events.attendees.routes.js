const attendees = require('../controllers/events.attendees.controllers');
const authenticate = require('../middleware/authenticate');


module.exports = function (app) {

    app.route(app.rootUrl + '/events/:id/attendees')
        .get(attendees.get_attendees)
        .post(authenticate.loginRequired, attendees.add_attendee)
        .delete(authenticate.loginRequired, attendees.delete_attendee);

    app.route(app.rootUrl + '/events/:event_id/attendees/:user_id')
        .patch(authenticate.loginRequired, attendees.update_attendee)

}