const db = require('../../config/db');
const users = require('../models/users.models');


async function findUserIdByToken (token) {
    const query = 'SELECT * FROM user WHERE auth_token = ?';
    const [results] = await db.getPool().query(query, [token]);
    return results;
};


exports.loginRequired = async function (req, res, next) {
    try {
        const token = req.header('X-Authorization');
        const results = await findUserIdByToken(token);
        if (results.length < 1) {
            res.status(401).send('Not logged in');
        } else {
            req.authenticatedUserId = results[0].id.toString();
            next();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}


exports.loggedOutRequired = async function (req, res, next) {
    try {
        const user = await users.check_for_email(req.body.email);
        if (user === null) {
            res.status(400).send('No users with that email');
        } else if (user.auth_token !== null) {
            res.status(400).send('Already logged in');
        } else {
            next();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}