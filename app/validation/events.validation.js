const validation = require('./validation');


const validDateTime = function (string) {

    // basic check
    if (!validation.isRequiredString(string)) {
        return false;
    }

    let valid_date = true;

    // check that the date follows the format (YYYY-MM-DD) or (YYYY-MM-DD HH:mm:SS.sss)
    let four_digit_regex = new RegExp('^[0-9]{4}$');
    let three_digit_regex = new RegExp('^[0-9]{3}$');
    let two_digit_regex = new RegExp('^[0-9]{2}$');

    const date_time = string.split(' ');

    if (date_time.length > 0 ) {
        const date = date_time[0].split('-');
        if (date.length !== 3) { valid_date = false; }

        const year = date[0];
        if (!four_digit_regex.test(year)) { valid_date = false; }

        const month = date[1];
        if (!two_digit_regex.test(month)) { valid_date = false; }

        const day = date[2];
        if (!two_digit_regex.test(day)) { valid_date = false; }
    }

    if (date_time.length > 1) {
        const time = date_time[1].split(':');
        if (time.length !== 3) { valid_date = false; }

        const hour = time[0];
        if (!two_digit_regex.test(hour)) { valid_date = false; }

        const minute = time[1];
        if (!two_digit_regex.test(minute)) { valid_date = false; }

        const sec_milisec = time[2].split('.')

        const seconds = sec_milisec[0];
        if (!two_digit_regex.test(seconds)) { valid_date = false; }

        if (sec_milisec.length > 1) {
            const milliseconds = sec_milisec[1];
            if (!three_digit_regex.test(milliseconds)) { valid_date = false; }
        }
    }

    if (date_time.length > 2) { valid_date = false; }

    // check that the event date is in the future
    const event_date = Date.parse(string);
    const today = new Date();
    if (event_date <= today) { valid_date = false; }

    return valid_date;

};


exports.add_event = function (event) {
    if (!validation.isRequiredString(event.title)) {
        return false;
    } else if (!validation.isRequiredString(event.description)) {
        return false;
    } else if (!validation.isArrayOfIntegers(event.categoryIds)) {
        return false;
    } else if (event.date !== undefined && !validDateTime(event.date)) {
        return false;
    } else if (event.isOnline !== undefined && event.isOnline !== null && typeof(event.isOnline) !== 'boolean') {
        return false;
    } else if (!validation.isNullableString(event.url)) {
        return false;
    } else if (!validation.isNullableString(event.venue)) {
        return false;
    } else if (event.capacity !== undefined && event.capacity !== null
        && !validation.isPositiveInteger(event.capacity)) {
        return false;
    } else if (event.requiresAttendanceControl !== undefined && event.requiresAttendanceControl !== null
        && typeof(event.requiresAttendanceControl) !== 'boolean') {
        return false;
    } else if (event.fee !== undefined && event.fee !== null && (typeof(event.fee) !== 'number' || event.fee < 0)) {
        return false;
    }
    return true;
}


exports.edit_event = function (event) {
    if (!validation.isOptionalString(event.title)) {
        return false;
    } else if (!validation.isOptionalString(event.description)) {
        return false;
    } else if (event.categoryIds !== undefined && !validation.isArrayOfIntegers(event.categoryIds)) {
        return false;
    } else if (event.date !== undefined && !validDateTime(event.date)) {
        return false;
    } else if (event.isOnline !== undefined && event.isOnline !== null && typeof(event.isOnline) !== 'boolean') {
        return false;
    } else if (!validation.isNullableString(event.url)) {
        return false;
    } else if (!validation.isNullableString(event.venue)) {
        return false;
    } else if (event.capacity !== undefined && event.capacity !== null
        && !validation.isPositiveInteger(event.capacity)) {
        return false;
    } else if (event.requiresAttendanceControl !== undefined && event.requiresAttendanceControl !== null
        && typeof(event.requiresAttendanceControl) !== 'boolean') {
        return false;
    } else if (event.fee !== undefined && event.fee !== null && (typeof(event.fee) !== 'number' || event.fee < 0)) {
        return false;
    }
    return true;
}