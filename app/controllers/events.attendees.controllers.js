const events = require('../models/events.models');
const attendees = require('../models/events.attendees.models');
const validation = require('../validation/events.attendees.validation');


function get_attendees_user_ids (attendee_list) {
    let user_ids = [];
    for (let row of attendee_list) {
        user_ids.push(row.user_id);
    }
    return user_ids;
}


exports.add_attendee = async function (req, res) {
    try {
        const event = await events.get_event_by_id(req.params.id);
        if (event === null) {
            res.status(404).send();
            return undefined;
        }
        const attendee_list = await attendees.get_attendees(req.params.id);
        const attendee_ids = get_attendees_user_ids(attendee_list);
        if (attendee_ids.includes(Number.parseInt(req.authenticatedUserId))) {
            res.status(403).send('You have already joined this event');
            return undefined;
        }
        if (Date.parse(event.date) < Date()) {
            res.status(403).send('You cannot join an event in the past');
            return undefined;
        }
        const attendance_status = Boolean(event.requires_attendance_control) ? 2 : 1;
        await attendees.add_attendee(req.params.id, req.authenticatedUserId, attendance_status);
        res.status(201).send();
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


function convert_attendees_to_json (attendees) {
    let attendees_json = [];
    for (let row of attendees) {
        const obj =
            {
                "attendeeId": row.user_id,
                "firstName": row.first_name,
                "lastName": row.last_name,
                "dateOfInterest": row.date_of_interest,
                "status": row.name
            };
        attendees_json.push(obj);
    }
    return attendees_json;
}


function filter_non_accepted (attendees, token) {
    let accepted_attendees = [];
    for (let attendee of attendees) {
        if (attendee.name === 'accepted') {
            accepted_attendees.push(attendee);
        } else if (token !== undefined && attendee.auth_token === token) {
            accepted_attendees.push(attendee);
        }
    }
    return accepted_attendees;
}


exports.get_attendees = async function (req, res) {
    try {
        const event = await events.get_event_by_id(req.params.id);
        if (event === null) {
            res.status(404).send();
            return undefined;
        }
        const token = req.header('X-Authorization');
        let attendee_list = await attendees.get_attendees(req.params.id);
        attendee_list = filter_non_accepted(attendee_list, token);
        attendee_list = convert_attendees_to_json(attendee_list);
        res.status(200).send(attendee_list);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


exports.delete_attendee = async function (req, res) {
    try {
        const event = await events.get_event_by_id(req.params.id);
        if (event === null) {
            res.status(404).send();
            return undefined;
        }
        const attendee = await attendees.get_attendee(req.params.id, Number.parseInt(req.authenticatedUserId));
        if (attendee === null) {
            res.status(403).send('User has not joined event');
            return undefined;
        } else if (attendee.attendance_status_id === 3) {
            res.status(403).send('User cannot remove themself if attendance status is "rejected"');
            return undefined;
        }
        await attendees.delete_attendee(req.params.id, Number.parseInt(req.authenticatedUserId));
        res.status(200).send();
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


function calc_status_id (status) {
    if (status === 'accepted') {
        return 1;
    } else if (status === 'pending') {
        return 2;
    } else if (status === 'rejected') {
        return 3;
    }
}


exports.update_attendee = async function (req, res) {
    try {
        const valid = validation.valid_status(req.body.status);
        if (!valid) {
            res.status(400).send("Status must be one of 'accepted', 'pending', or 'rejected'");
            return undefined;
        }
        const event = await events.get_event(req.params.event_id);
        if (event === null) {
            res.status(404).send();
            return undefined;
        }
        const organizer_id = event.organizerId;
        if (organizer_id !== Number.parseInt(req.authenticatedUserId)) {
            res.status(403).send('Only the organizer can update the status of an attendee');
            return undefined;
        }
        const attendee = await attendees.get_attendee(req.params.event_id, req.params.user_id);
        if (attendee === null) {
            res.status(404).send();
            return undefined;
        }
        const status_id = calc_status_id(req.body.status);
        await attendees.update_attendee(req.params.event_id, req.params.user_id, status_id);
        res.status(200).send();
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};