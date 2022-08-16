const User = require('../database/models/user')
const { isNullOrWhiteSpace } = require("../helpers/validation");

exports.searchUsers = function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    if(!req.body.query || isNullOrWhiteSpace(req.body.query))
        return res.status(200).json([])

    const query = req.body.query
    const userId = req.userId

    User.find({ username: { $regex: query, $options: 'i' }, _id: { $ne: userId } }, '_id username originalAvatarUrl avatarUrl description createdAt', function (err, users) {
        if (err)
            return res.status(500).json({ message: "Internal Error" })

        return res.status(200).json(users)
    })
}