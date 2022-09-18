const images = require('../models/users.images.models');
const users = require('../models/users.models');
const validation = require('../validation/images.validation');
const fs = require('mz/fs');
const path = require('path');


exports.put_image = async function (req, res) {
    try {
        const valid = validation.check_content_type(req.headers["content-type"]);
        if (!valid) {
            res.status(400).send();
        }
        const user = await users.get_user(req.params.id);
        if (user === null) {
            res.status(404).send();
            return undefined;
        }
        if (user.id !== Number.parseInt(req.authenticatedUserId)) {
            res.status(403).send('User can only add/update their own photo');
            return undefined;
        }
        let image_filename = await images.get_image_filename(req.params.id); // original filename
        let status_num = 200;
        if (image_filename === null) {
            status_num = 201;
        }
        const file_type = req.headers["content-type"].split('/')[1];
        image_filename = 'user_' + req.params.id.toString()  + '.' + file_type; // generate new image filename
        await images.insert_image_filename(image_filename, req.params.id);
        const location = path.join(__dirname, '../../storage/images/' + image_filename);
        await fs.writeFile(location, req.body);
        res.status(status_num).send();
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


function get_content_type (image_filename) {
    const file_type = image_filename.split('.')[1];
    if (file_type === 'jpg' || file_type === 'jpeg') {
        return 'image/jpeg';
    } else if (file_type === 'png') {
        return 'image/png';
    } else if (file_type === 'gif') {
        return 'image/gif';
    } else {
        throw 'The image filed stored is not a JPEG, PNG or GIF';
    }
}


exports.get_image = async function (req, res) {
    try {
        const user = await users.get_user(req.params.id);
        if (user === null || user.image_filename === null) {
            res.status(404).send();
            return undefined;
        }
        const image_filename = user.image_filename;
        const content_type = get_content_type(image_filename);
        const location = path.join(__dirname, '../../storage/images/' + image_filename);
        res.set('Content-Type', content_type);
        res.status(200).sendFile(location);

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};


exports.delete_image = async function (req, res) {
    try {
        const user = await users.get_user(req.params.id);
        if (user === null) {
            res.status(404).send();
            return undefined;
        }
        if (user.id !== Number.parseInt(req.authenticatedUserId)) {
            res.status(403).send('User can only delete their own photo');
            return undefined;
        }
        let image_filename = await images.get_image_filename(req.params.id);
        if (image_filename === null) {
            res.status(404).send('usr does not have a profile photo');
            return undefined;
        }
        await images.remove_image_filename(req.params.id);

        const location = path.join(__dirname, '../../storage/images/' + image_filename);
        await fs.unlink(location);
        res.status(200).send();
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
};