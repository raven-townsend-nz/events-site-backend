const db = require('../../config/db');


exports.check_categories = async function (categoryIds) {
    const check_id_sql = 'SELECT * FROM category WHERE id = ?;';
    let matching_categories;
    for (let id of categoryIds) {
        [matching_categories] = await db.getPool().query(check_id_sql, [id]);
        if (matching_categories.length < 1) {
            return false;
        }
    }
    return true;
};


exports.title_date_organizer_exists = async function (title, date, organizer_id) {
    const query = 'SELECT * FROM event WHERE title = ? AND date = ? AND organizer_id = ?';
    const [results] = await db.getPool().query(query, [title, date, organizer_id]);
    return results.length >= 1;
}


exports.insert_event = async function (event_obj) {
    let insert_sql = 'INSERT INTO event (organizer_id, title, description, date';
    let injection_values = [event_obj.organizer_id, event_obj.title, event_obj.description, event_obj.date];

    let num_injections = 0;
    if (event_obj.is_online !== null) {
        insert_sql = insert_sql + ', is_online';
        injection_values.push(event_obj.is_online);
        num_injections++;
    }
    if (event_obj.url !== null) {
        insert_sql = insert_sql + ', url';
        injection_values.push(event_obj.url);
        num_injections++;
    }
    if (event_obj.venue !== null) {
        insert_sql = insert_sql + ', venue';
        injection_values.push(event_obj.venue);
        num_injections++;
    }
    if (event_obj.capacity !== null) {
        insert_sql = insert_sql + ', capacity';
        injection_values.push(event_obj.capacity);
        num_injections++;
    }
    if (event_obj.requires_attendance_control !== null) {
        insert_sql = insert_sql + ', requires_attendance_control';
        injection_values.push(event_obj.requires_attendance_control);
        num_injections++;
    }
    if (event_obj.fee !== null) {
        insert_sql = insert_sql + ', fee';
        injection_values.push(event_obj.fee);
        num_injections++;
    }
    insert_sql = insert_sql + ') VALUES (?, ?, ?, ?';
    while (num_injections > 0) {
        insert_sql = insert_sql + ', ?';
        num_injections--;
    }
    insert_sql = insert_sql + ');';

    const [result] = await db.getPool().query(insert_sql, injection_values);
    return result.insertId;
};


exports.link_event_categories = async function (eventId, categoryIds) {
    const insert_sql = 'INSERT INTO event_category (event_id, category_id) VALUES (?, ?);';
    for (let categoryId of categoryIds) {
        await db.getPool().query(insert_sql, [eventId, categoryId]);
    }
};


function generate_order_by(sortBy) {
    let orderBy; // sortBy translated into sql
    if (sortBy === 'ALPHABETICAL_ASC') {
        orderBy = 'E.title, U.last_name';
    } else if (sortBy === 'ALPHABETICAL_DESC') {
        orderBy = 'E.title DESC, U.last_name';
    } else if (sortBy === 'DATE_ASC') {
        orderBy = 'E.date, U.last_name';
    } else if (sortBy === 'DATE_DESC') {
        orderBy = 'E.date DESC, U.last_name';
    } else if (sortBy === 'ATTENDEES_ASC') {
        orderBy = 'attendees, U.last_name';
    } else if (sortBy === 'ATTENDEES_DESC') {
        orderBy = 'attendees DESC, U.last_name';
    } else if (sortBy === 'CAPACITY_ASC') {
        orderBy = 'E.capacity, U.last_name';
    } else if (sortBy === 'CAPACITY_DESC') {
        orderBy = 'E.capacity DESC, U.last_name';
    } else {
        orderBy = 'E.date DESC';
    }
    return orderBy;
}


function generate_sql_select(q, categoryIds, organizerId, sortBy, offset, limit) {
    let query = 'SELECT E.id AS event_id, E.title, U.first_name, U.last_name, E.date, ' +
        'COUNT(DISTINCT EA.user_id) AS attendees, E.capacity ' +
        'FROM event E ' +
        'JOIN user U ON U.id = E.organizer_id ' +
        'LEFT OUTER JOIN ' +
        "(event_attendees EA JOIN attendance_status STAT ON EA.attendance_status_id = STAT.id AND STAT.name = 'accepted') " +
        "ON E.id = EA.event_id " +
        'LEFT OUTER JOIN event_category EC ON E.id = EC.event_id';
    if (q !== undefined || categoryIds !== undefined || organizerId !== undefined) {
        query = query + ' WHERE';
    }
    let injection_values = [];
    if (q !== undefined) {
        query = query + " (E.title LIKE '%" + q + "%' OR E.description LIKE '%" + q + "%')";
        if (categoryIds !== undefined || organizerId !== undefined) { query = query + ' AND'; }
    }
    if (organizerId !== undefined) {
        query = query + ' (E.organizer_id = ?)';
        injection_values.push(Number.parseInt(organizerId));
        if (categoryIds !== undefined) { query = query + ' AND'; }
    }
    if (categoryIds !== undefined) {
        query = query + ' (EC.category_id IS NOT NULL';
        if (categoryIds.length > 0) { query = query + ' AND ('; }
        let counter = 0;
        for (let categoryId of categoryIds) {
            query = query + 'EC.category_id = ?';
            injection_values.push(Number.parseInt(categoryId));
            if (counter < categoryIds.length - 1) { // if we're not at the last item
                query = query + ' OR ';
            } else {
                query = query + ')';
            }
            counter++;
        }
        query = query + ')';
    }

    query = query + ' GROUP BY E.id, E.title, U.first_name, U.last_name, E.capacity, E.date';
    query = query + ' ORDER BY ' + generate_order_by(sortBy);
    if (limit !== undefined) {
        query = query + ' LIMIT ' + limit;
    } else {
        query = query + ' LIMIT 18446744073709551615';
    }
    if (offset !== undefined) {
        query = query + ' OFFSET ' + offset;
    }

    query = query + ';';
    return [query, injection_values];
}


async function add_categories (events) {
    for (let i = 0; i < events.length; i++) {
        const id = events[i].event_id;
        const sql = "SELECT category_id, event_id FROM event_category WHERE event_id = ?;";
        const [ids] = await db.getPool().query(sql, [id]);
        const categories = [];
        for (let row of ids) {
            categories.push(row.category_id);
        }
        events[i]['categories'] = categories;
    }
    return events;
}


function convert_events_to_json (events) {
    let event_objects = [];
    for (let event of events) {
        const obj = {
            "eventId": event.event_id,
            "title": event.title,
            "capacity": event.capacity,
            "organizerFirstName": event.first_name,
            "organizerLastName": event.last_name,
            "date": event.date,
            "categories": event.categories,
            "numAcceptedAttendees": event.attendees
        }
        event_objects.push(obj);
    }
    return event_objects;
}


exports.get_events = async function (q, categoryIds, organizerId, sortBy, offset, limit) {
    const [query, injection_values] = generate_sql_select(q, categoryIds, organizerId, sortBy, offset, limit);
    let [events] = await db.getPool().query(query, injection_values);
    events = await add_categories(events);
    events = convert_events_to_json(events);
    return events;
};


function convert_event_to_json (event) {
    const obj =
        {
            "eventId": event.event_id,
            "title": event.title,
            "categories": event.categories,
            "organizerFirstName": event.first_name,
            "organizerLastName": event.last_name,
            "numAcceptedAttendees": event.attendees,
            "capacity": event.capacity,
            "description": event.description,
            "organizerId": event.user_id,
            "date": event.date,
            "isOnline": Boolean(event.is_online),
            "url": event.url,
            "venue": event.venue,
            "requiresAttendanceControl": Boolean(event.requires_attendance_control),
            "fee": Number.parseFloat(event.fee)
        };
    return obj;
}


exports.get_event = async function (eventId) {
    let query = 'SELECT E.id AS event_id, E.title, U.first_name, U.last_name, E.description, U.id AS user_id, E.date, ' +
        'E.is_online, E.url, COUNT(DISTINCT EA.user_id) AS attendees, E.capacity, E.venue, E.requires_attendance_control, E.fee ' +
        'FROM event E ' +
        'JOIN user U ON U.id = E.organizer_id AND E.id = ?' +
        'LEFT OUTER JOIN ' +
        "(event_attendees EA JOIN attendance_status STAT ON EA.attendance_status_id = STAT.id AND STAT.name = 'accepted') " +
        "ON E.id = EA.event_id " +
        'LEFT OUTER JOIN event_category EC ON E.id = EC.event_id;';
    let [events] = await db.getPool().query(query, [eventId]);
    events = await add_categories(events);
    let event = convert_event_to_json(events[0]);
    if (events[0].event_id === null) {
        return null;
    }
    return event;
};


exports.get_event_by_id = async function (eventId) {
    const sql = 'SELECT * FROM event WHERE id = ?';
    const [results] = await db.getPool().query(sql, [eventId]);
    if (results.length > 0) {
        return results[0];
    } else {
        return null;
    }
}


exports.delete_event_categories = async function (eventId) {
    const delete_statement = 'DELETE FROM event_category WHERE event_id = ?;';
    await db.getPool().query(delete_statement, [eventId]);
}


function all_fields_null (event_obj) {
    for (let key of Object.keys(event_obj)) {
        if (event_obj[key] !== null) {
            return false;
        }
    }
    return true;
}


exports.edit_event = async function (event_obj, event_id) {
    if (all_fields_null(event_obj)) { return undefined; }
    let update_sql = 'UPDATE event SET';
    let injection_values = [];

    let num_injections = 0;
    if (event_obj.title !== null) {
        update_sql = update_sql + ' title = ?';
        injection_values.push(event_obj.title);
        num_injections++;
    }
    if (event_obj.description !== null) {
        if (num_injections !== 0) { update_sql = update_sql + ','; }
        update_sql = update_sql + ' description = ?';
        injection_values.push(event_obj.description);
        num_injections++;
    }
    if (event_obj.date !== null) {
        if (num_injections !== 0) { update_sql = update_sql + ','; }
        update_sql = update_sql + ' date = ?';
        injection_values.push(event_obj.date);
        num_injections++;
    }
    if (event_obj.is_online !== null) {
        if (num_injections !== 0) { update_sql = update_sql + ','; }
        update_sql = update_sql + ' is_online = ?';
        injection_values.push(event_obj.is_online);
        num_injections++;
    }
    if (event_obj.url !== null) {
        if (num_injections !== 0) { update_sql = update_sql + ','; }
        update_sql = update_sql + ' url = ?';
        injection_values.push(event_obj.url);
        num_injections++;
    }
    if (event_obj.venue !== null) {
        if (num_injections !== 0) { update_sql = update_sql + ','; }
        update_sql = update_sql + ' venue = ?';
        injection_values.push(event_obj.venue);
        num_injections++;
    }
    if (event_obj.capacity !== null) {
        if (num_injections !== 0) { update_sql = update_sql + ','; }
        update_sql = update_sql + ' capacity = ?';
        injection_values.push(event_obj.capacity);
        num_injections++;
    }
    if (event_obj.requires_attendance_control !== null) {
        if (num_injections !== 0) { update_sql = update_sql + ','; }
        update_sql = update_sql + ' requires_attendance_control = ?';
        injection_values.push(event_obj.requires_attendance_control);
        num_injections++;
    }
    if (event_obj.fee !== null) {
        if (num_injections !== 0) { update_sql = update_sql + ','; }
        update_sql = update_sql + ' fee = ?';
        injection_values.push(event_obj.fee);
        num_injections++;
    }
    update_sql = update_sql + ' WHERE id = ?;';
    injection_values.push(Number.parseInt(event_id));
    num_injections++;
    await db.getPool().query(update_sql, injection_values);
};


exports.delete_event_attendess = async function (eventId) {
    const sql = 'DELETE FROM event_attendees WHERE event_id = ?;';
    await db.getPool().query(sql, [eventId]);
};


exports.delete_event = async function (eventId) {
    const sql = 'DELETE FROM event WHERE id = ?;';
    await db.getPool().query(sql, [eventId]);
};


exports.get_categories = async function () {
    const sql = 'SELECT * FROM category;';
    const [categories] = await db.getPool().query(sql);
    return categories;
};