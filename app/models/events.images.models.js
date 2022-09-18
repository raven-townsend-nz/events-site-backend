const db = require('../../config/db');


exports.get_image_filename = async function (event_id) {
    const sql = 'SELECT image_filename FROM event WHERE id = ?;';
    const [results] = await db.getPool().query(sql, [event_id]);
    return results[0].image_filename;
};


exports.insert_image_filename = async function (image_filename, event_id) {
    const sql = 'UPDATE event SET image_filename = ? WHERE id = ?;';
    await db.getPool().query(sql, [image_filename, event_id]);
}