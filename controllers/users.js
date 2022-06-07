const User = require('../database/models/user')

exports.searchUsers = function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    const query = req.body.query
    const userId = req.userId

    User.find({ username: { $regex: query }, _id: { $ne: userId } }, 'username originalAvatarUrl avatarUrl description createdAt', function (err, users) {
        if (err)
            return res.status(500).json({ message: "Internal Error" })

        return res.status(200).json(users)
    })
}