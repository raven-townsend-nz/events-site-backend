const db = require('../../config/db');
const randtoken = require('rand-token');
const passwords = require('../middleware/passwords');


exports.register_user = async function (user) {
    const first_name = user.firstName;
    const last_name = user.lastName;
    const email = user.email;
    const hash = await passwords.hash(user.password);

    const insert_user = 'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?);';
    const [result] = await db.getPool().query(insert_user, [first_name, last_name, email, hash]);
    return result.insertId;
};


exports.check_for_email = async function (email) {
    const sql = 'SELECT * FROM user WHERE email = ?;';
    const users = (await db.getPool().query(sql, [email]))[0];
    let user;
    if (users.length < 1) {
        return null;
    } else {
        user = users[0];
        return user;
    }
}


exports.check_email_and_password = async function (user, password) {
    // Check correct password has been used
    return await passwords.compare(password, user.password);
};


exports.generate_token = async function (user_id) {
    // Generate token, and save it in the database, and send it to client
    const token_query = 'SELECT * FROM user WHERE auth_token = ?;'
    let token_in_use = true;
    let users_with_token;
    let token;
    while (token_in_use) {
        token = randtoken.generate(32);
        [users_with_token] = await db.getPool().query(token_query, [token]);
        if (users_with_token.length < 1) { token_in_use = false; }
    }

    const insert_token = 'UPDATE user SET auth_token = ? WHERE id = ?;';
    await db.getPool().query(insert_token, [token, user_id]);

    return token;
};


exports.logout = async function (token) {
    const logout_sql = 'UPDATE user SET auth_token = NULL WHERE auth_token = ?;';
    await db.getPool().query(logout_sql, [token]);
}


exports.get_user = async function (userId) {
    const get_user_sql = 'SELECT * FROM user WHERE id = ?;';
    const users = await db.getPool().query(get_user_sql, [userId]);
    if (users[0].length < 1) {
        return null;
    } else {
        return users[0][0];
    }
};


exports.check_id_and_password = async function (userId, password) {
    // Check correct password has been used
    const user = await exports.get_user(userId);
    return await passwords.compare(password, user.password);
};


exports.update_user = async function (userId, firstName, lastName, email, password) {
    const user = await exports.get_user(userId);
    firstName = (firstName === undefined ? user.first_name : firstName);
    lastName = (lastName === undefined ? user.last_name : lastName);
    email = (email === undefined ? user.email : email);
    password = (password === undefined ? user.password : password);
    const hash = await passwords.hash(password);

    const update_user_sql = 'UPDATE user SET first_name = ?, last_name = ?, email = ?, password = ? WHERE id = ?;';
    await db.getPool().query(update_user_sql, [firstName, lastName, email, hash, userId]);
}