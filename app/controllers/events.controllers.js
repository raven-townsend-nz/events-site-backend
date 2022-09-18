const events = require('../models/events.models');
const validation = require('../validation/events.validation');


function supplied (value) {
    return !(value === null || value === undefined);
}


function create_event_object (body, userId) {
    let obj =
        {
            title: supplied(body.title) ? body.title : null,
            description: supplied(body.description) ? body.description : null,
            date: supplied(body.date) ? body.date : null,
            is_online: supplied(body.isOnline) ? body.isOnline : null,
            url: supplied(body.url) ? body.url : null,
            venue: supplied(body.venue) ? body.venue : null,
            capacity: supplied(body.capacity) ? body.capacity : null,
            requires_attendance_control: supplied(body.requiresAttendanceControl) ? body.requiresAttendanceControl : null,
            fee: supplied(body.fee) ? body.fee : null,
            organizer_id: supplied(userId) ? userId : null
        };
    return obj;
}


exports.add_event = async function (req, res) {
    try {
        const valid = validation.add_event(req.body);
        if (!valid) {
            res.status(400).send('One or more of the fields do not follow the correct format');
            return undefined;
        }
        let categoryIds = req.body.categoryIds;
        if (categoryIds !== undefined && !Array.isArray(categoryIds)) {
            categoryIds = [categoryIds];
        }
        if (categoryIds !== undefined) {
            const categories_ok = await events.check_categories(categoryIds);
            if (!categories_ok) {
                res.status(400).send("One of more category IDs don't exist");
                return undefined;
            }
        }
        const duplicate = await events.title_date_organizer_exists(req.body.title, req.body.date, req.authenticatedUserId);
        if (duplicate) {
            res.status(400).send('Event already created');
            return undefined;
        }
        const userId = req.authenticatedUserId;
        const event_obj = create_event_object(req.body, userId);
        const insertId = await events.insert_event(event_obj);
        if (categoryIds !== undefined) {
            await events.link_event_categories(insertId, categoryIds);
        }
        res.status(201).send({"eventId": insertId});
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


exports.view_events = async function (req, res) {
    try {
        const q = req.query.q;
        let categoryIds = req.query.categoryIds;
        if (categoryIds !== undefined && !Array.isArray(categoryIds)) {
            categoryIds = [categoryIds];
        }
        const organizerId = req.query.organizerId;
        const sortBy = req.query.sortBy;
        const offset = req.query.startIndex;
        const limit = req.query.count;
        const categories_ok = (categoryIds === undefined) || (await events.check_categories(categoryIds));
        if (!categories_ok) {
            res.status(400).send("One of more category IDs don't exist");
            return undefined;
        }
        const results = await events.get_events(q, categoryIds, organizerId, sortBy, offset, limit);
        res.status(200).send(results);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


function format_event(event) {
    let obj =
    {
        "id": event.eventId,
        "title": event.title,
        "description": event.description,
        "organizerId": event.organizerId,
        "organizerFirstName": event.organizerFirstName,
        "organizerLastName": event.organizerLastName,
        "attendeeCount": event.numAcceptedAttendees,
        "capacity": event.capacity,
        "isOnline": Number(event.isOnline),
        "url": event.url,
        "venue": event.venue,
        "requiresAttendanceControl": Number(event.requiresAttendanceControl),
        "fee": event.fee.toFixed(2),
        "categories": event.categories,
        "date": event.date
    };
    return obj;
}


exports.get_event = async function (req, res) {
    try {
        const event = await events.get_event_by_id(req.params.id)
        if (event === null) {
            res.status(404).send('No event matching that ID');
        } else {
            let event = await events.get_event(req.params.id);
            event = format_event(event);
            res.status(200).send(event);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}


exports.edit_event = async function (req, res) {
    try {
        const event = await events.get_event_by_id(req.params.id)
        if (event === null) {
            res.status(404).send('No event matching that ID');
            return undefined;
        }
        if (event.organizer_id !== Number.parseInt(req.authenticatedUserId)) {
            res.status(403).send('You can only edit your own events');
            return undefined;
        }
        const valid = validation.edit_event(req.body);
        if (!valid) {
            res.status(400).send('One or more of the fields do not follow the correct format');
            return undefined;
        }
        let categoryIds = req.body.categoryIds;
        if (categoryIds !== undefined && !Array.isArray(categoryIds)) {
            categoryIds = [categoryIds];
        }
        if (categoryIds !== undefined) {
            const categories_ok = await events.check_categories(categoryIds);
            if (!categories_ok) {
                res.status(400).send("One of more category IDs don't exist");
                return undefined;
            }
            await events.delete_event_categories(req.params.id);
            await events.link_event_categories(req.params.id, categoryIds);
        }
        const event_obj = create_event_object(req.body);
        await events.edit_event(event_obj, req.params.id);
        res.status(200).send();

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


exports.delete_event = async function (req, res) {
    try {
        const event = await events.get_event_by_id(req.params.id);
        if (event === null) {
            res.status(404).send('No event matching that ID');
            return undefined;
        }
        if (event.organizer_id !== Number.parseInt(req.authenticatedUserId)) {
            res.status(403).send('You can only delete your own events');
            return undefined;
        }
        await events.delete_event_categories(req.params.id);
        await events.delete_event_attendess(req.params.id);
        await events.delete_event(req.params.id);
        res.status(200).send();
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}


exports.get_categories = async function (req, res) {
    try {
        const categories = await events.get_categories();
        res.status(200).send(categories);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}