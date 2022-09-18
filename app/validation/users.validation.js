const validation = require('./validation');


exports.validateRegister = function (user) {
    if (!validation.isRequiredString(user.firstName)) {
        return false;
    } else if (!validation.isRequiredString(user.lastName)) {
        return false;
    } else if (!validation.isRequiredString(user.email)) {
        return false;
    } else if (!validation.isRequiredString(user.password)) {
        return false;
    } else if (!user.email.includes('@')) {
        return false;
    }
    return true;
};


exports.validateLogin = function (user) {
    if (!validation.isRequiredString(user.email)) {
        return false;
    } else if (!validation.isRequiredString(user.password)) {
        return false;
    } else if (!user.email.includes('@')) {
        return false;
    }
    return true;
};


exports.validateChangeUserRequest = function (user_fields, email) {
    let field;
    for (field in user_fields) {
        if (!validation.isOptionalString(field)) {
            return false;
        }
    }
    return email === undefined || email.includes('@');

};