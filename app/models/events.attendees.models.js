const db = require('../../config/db');

exports.add_attendee = async function (event_id, user_id, attendance_status) {
    const sql = 'INSERT INTO event_attendees (event_id, user_id, attendance_status_id) VAlUES (?, ?, ?);';
    await db.getPool().query(sql, [event_id, user_id, attendance_status]);
};


exports.get_attendees = async function (event_id) {
    const sql =
        'SELECT EA.user_id, U.first_name, U.last_name, EA.date_of_interest, A.name, U.auth_token ' +
        'FROM event_attendees EA ' +
        'JOIN user U ON U.id = EA.user_id ' +
        'JOIN attendance_status A ON A.id = EA.attendance_status_id ' +
        'WHERE EA.event_id = ? ' +
        'ORDER BY EA.date_of_interest, EA.user_id;';
    let [attendees] = await db.getPool().query(sql, [event_id]);

    return attendees;
}


exports.get_attendee = async function (event_id, user_id) {
    const sql = 'SELECT * FROM event_attendees WHERE event_id = ? AND user_id = ?;';
    const [results] = await db.getPool().query(sql, [event_id, user_id]);
    if (results.length < 1) {
        return null;
    } else {
        return results[0];
    }
};


exports.delete_attendee = async function (event_id, user_id) {
    const sql = 'DELETE FROM event_attendees WHERE event_id = ? AND user_id = ?;';
    await db.getPool().query(sql, [event_id, user_id]);
};


exports.update_attendee = async function (event_id, user_id, status_id) {
    const sql = 'UPDATE event_attendees SET attendance_status_id = ? WHERE event_id = ? AND user_id = ?;';
    await db.getPool().query(sql, [status_id, event_id, user_id]);
};