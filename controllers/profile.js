let crypto = require('crypto')
const User = require('../database/models/user')

exports.updateAvatar = function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    const newAvatarUrl = req.body.avatarUrl
    const newOriginalAvatarUrl = req.body.originalAvatarUrl

    if (IsNullOrWhiteSpace(newAvatarUrl) || IsNullOrWhiteSpace(newOriginalAvatarUrl))
        return res.status(400).json({ message: 'Fields must be not empty' })

    User.findOneAndUpdate({_id: req.userId}, {avatarUrl: newAvatarUrl, originalAvatarUrl: newOriginalAvatarUrl}, null, function(err) {
        if (err)
            return res.status(500).json({ message: 'Internal Error' })

        return res.status(200).json({ message: 'Profile avatar updated successfully' })
    })
}

exports.updateUsername = function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    const newUsername = req.body.username

    if (IsNullOrWhiteSpace(newUsername))
        return res.status(400).json({ message: 'Fields must be not empty' })

    User.findOneAndUpdate({_id: req.userId}, {username: newUsername}, null, function(err) {
        if (err)
            return res.status(500).json({ message: 'Internal Error' })

        return res.status(200).json({ message: 'Profile username updated successfully' })
    })
}

exports.updatePassword = function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: 'Not Authorized' })

    const oldPassword = req.body.oldPassword
    const newPassword = req.body.newPassword

    if (IsNullOrWhiteSpace(oldPassword) || IsNullOrWhiteSpace(newPassword))
        return res.status(400).json({ message: 'Fields must be not empty' })

    User.findOne({ _id: req.userId}, function (err, user) {
        if (err)
            return res.status(500).json({ message: 'Internal Error' })

        if (!user)
            return res.status(400).json({ message: 'User Not Found' })

        const oldPasswordHash = crypto.createHash('sha256').update(oldPassword).digest('hex');

        if (oldPasswordHash !== user.passwordHash)
            return res.status(406).json({ message: 'Old password is incorrect' });

        const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

        if (user.passwordHash === newPasswordHash)
            return res.status(200).json({ message: 'Profile security information did not change' })

        User.findOneAndUpdate({_id: req.userId}, {passwordHash: newPasswordHash}, null, function(err) {
            if (err)
                return res.status(500).json({ message: 'Internal Error' })

            return res.status(200).json({ message: 'Profile security information updated successfully' })
        })
    })
}

function IsNullOrWhiteSpace(str) {
    return str == null || str.trim() === ''
}