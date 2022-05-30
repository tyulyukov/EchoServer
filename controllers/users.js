const User = require('../database/models/user')

exports.searchUsers = function (req, res) {
    if (!req.user)
        return res.status(401)

    const query = req.body.query
    const userId = req.user._id

    User.find({ username: { $regex: query }, _id: { $ne: userId } }, 'username avatarUrl description createdAt', function (err, users) {
        if (err)
            return res.status(500)

        return res.status(200).json(users)
    })
}