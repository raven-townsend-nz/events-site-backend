let status_options = ["accepted", "pending", "rejected"]

exports.valid_status = function (status) {
    return status_options.includes(status);
}