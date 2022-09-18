const users = require('../models/users.models');
const validation = require('../validation/users.validation');



exports.register_user = async function (req, res) {
    try {
        const valid = validation.validateRegister(req.body);
        if (!valid) {
            res.status(400).send('One or more of the fields do not follow the correct format');
        } else {
            const user = await users.check_for_email(req.body.email);
            if (user !== null) {
                res.status(400).send('Account with that email already exists')
            } else {
                const userId = await users.register_user(req.body);
                res.status(201).send({"userId": userId}) // user should be a JSON object with just 'userId' field.
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


exports.login = async function (req, res) {
    try {
        const valid = validation.validateLogin(req.body);
        if (!valid) {
            res.status(400).send('Email or password do not follow the correct format');
            return undefined;
        }
        const email = req.body.email;
        const password = req.body.password;

        const user = await users.check_for_email(email);
        if (user === null) {
            res.status(400).send('Invalid email or password');
            return undefined;
        }
        const valid_login = await users.check_email_and_password(user, password);
        if (!valid_login) {
            res.status(400).send('Invalid email or password');
            return undefined;
        }
        const token = await users.generate_token(user.id);
        res.status(200).send( {"userId": user.id, "token": token} );
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


exports.logout = async function (req, res) {
    try {
        const token = req.header('X-Authorization');
        await users.logout(token);
        res.status(200).send();
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


exports.get_user = async function (req, res) {
    try {
        const userId = req.params.id;
        const user = await users.get_user(userId);

        if (user === null) {
            res.status(404).send();

        } else {
            const req_token = req.header('X-Authorization');
            const firstName = user.first_name;
            const lastName = user.last_name;
            const email = user.email;
            let json;

            // send email as well if request token matches the token of the user received from the database
            if (user.auth_token === req_token) {
                json = {
                            "firstName": firstName,
                            "lastName": lastName,
                            "email": email
                       }
                res.status(200).send(json);

                // otherwise just send first and last name
            } else {
                json = {
                            "firstName": firstName,
                            "lastName": lastName
                       }
                res.status(200).send(json);
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


exports.edit = async function (req, res) {
    try {
        const userId = req.params.id;
        let firstName = req.body.firstName;
        let lastName = req.body.lastName;
        let email = req.body.email;
        let password = req.body.password;
        let currentPassword = req.body.currentPassword;

        // check all fields are syntactically valid
        let valid = validation.validateChangeUserRequest([firstName, lastName, password, currentPassword], email);

        const user = await users.get_user(userId);
        if (user === null) {
            res.status(404).send();
        }

        // check that the current password is correct (if required)
        const needs_current_password = (password !== undefined);
        if (needs_current_password && currentPassword === undefined) {
            valid = false;
        } else if (needs_current_password) {
            const correct_current_password = await users.check_id_and_password(userId, currentPassword);
            valid = valid && correct_current_password;
        }

        if (!valid) {
            res.status(400).send('One of the fields is incorrect');
            return undefined;
        }
        const req_token = req.header('X-Authorization');
        if (user.auth_token !== req_token) {
            res.status(403).send("You cannot edit this user's information");
        } else {
            await users.update_user(userId, firstName, lastName, email, password);
            res.status(200).send();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};
