exports.check_content_type = function (content_type) {
    let allowed_content_types = ['image/png', 'image/jpeg', 'image/gif'];
    return allowed_content_types.includes(content_type);
}