const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/
const usernameRegex = /^[a-z0-9_.-]{5,20}$/

exports.validatePassword = function (password) {
    return validate(passwordRegex, password)
}

exports.validateUsername = function (username) {
    return validate(usernameRegex, username)
}

exports.isNullOrWhiteSpace = function (str) {
    return str == null || str.trim() === ''
}

function validate(regex, str) {
    const res = regex.exec(str);
    const valid = !!res;
    return valid;
}