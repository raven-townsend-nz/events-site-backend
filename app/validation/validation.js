exports.isRequiredString = function (string) {
    if (string === undefined || string === null) {
        return false;
    } else if (typeof(string) !== 'string') {
        return false;
    } else if (string.length < 1) {
        return false;
    }
    return true;
}


exports.isOptionalString = function (string) {
    if (string === undefined) {
        return true;
    } else if (string === null) {
        return false;
    } else if (typeof(string) !== 'string') {
        return false;
    } else if (string.length < 1) {
        return false;
    }
    return true;
}


exports.isNullableString = function (string) {
    if (string === undefined || string === null) {
        return true;
    } else if (typeof(string) !== 'string') {
        return false;
    } else if (string.length < 1) {
        return false;
    }
    return true;
}


exports.isArrayOfIntegers = function (array) {
    if (array === undefined || array === null) {
        return false;
    } else if (!Array.isArray(array)) {
        return false;
    } else if (array.length < 1) {
        return false;
    } else if (!array.every(function(element) {return typeof(element) === 'number';})) {
        return false;
    }
    return true;
}


exports.isPositiveInteger = function (num) {
    if (typeof(num) !== 'number') {
        return false;
    } else if (num < 1) {
        return false;
    } else if (!Number.isInteger(num)) {
        return false;
    }
    return true;
}