const db = require('../../config/db');


exports.get_image_filename = async function (user_id) {
    const sql = 'SELECT image_filename FROM user WHERE id = ?;';
    const [results] = await db.getPool().query(sql, [user_id]);
    return results[0].image_filename;
};


exports.insert_image_filename = async function (image_filename, user_id) {
    const sql = 'UPDATE user SET image_filename = ? WHERE id = ?;';
    await db.getPool().query(sql, [image_filename, user_id]);
}


exports.remove_image_filename = async function (user_id) {
    const sql = 'UPDATE user SET image_filename = NULL WHERE id = ?;';
    await db.getPool().query(sql, [user_id]);
}