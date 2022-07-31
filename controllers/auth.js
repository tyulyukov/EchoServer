let crypto = require('crypto')
let databaseDebug = require('debug')('echo:database')
const tokenKey = process.env.TOKEN_KEY

const User = require('../database/models/user')

const validator = require('../helpers/validation')

exports.middlewareAuth = function (req, res, next) {
    if (req.headers.authorization) {
        let token = decodeURI(req.headers.authorization)

        let tokenParts = token.split('.')
        let signature = crypto
            .createHmac('SHA256', tokenKey)
            .update(`${tokenParts[0]}.${tokenParts[1]}`)
            .digest('base64')

        if (signature === tokenParts[2])
            req.userId = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'))
    }

    return next()
}

exports.login = async function (req, res) {
    if (!req.body.username || !req.body.password)
        return res.status(400).json({ message: 'Fields must be not empty' })

    const username = req.body.username.toLowerCase()
    const password = req.body.password

    if (validator.isNullOrWhiteSpace(username) || validator.isNullOrWhiteSpace(password))
        return res.status(400).json({ message: 'Fields must be not empty' })

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    User.findOne( {username: username, passwordHash: passwordHash}, function (err, user) {
        if (err) {
            databaseDebug(err)
            return res.status(500).json({ message: 'Internal Error' })
        }


        if (!user)
            return res.status(400).json({ message: 'User Not Found' })

        let head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'jwt' })).toString('base64')
        let body = Buffer.from(JSON.stringify(user._id)).toString('base64')
        let signature = crypto.createHmac('SHA256', tokenKey).update(`${head}.${body}`).digest('base64')

        return res.status(200).json({
            user: {
                _id: user._id,
                username: user.username,
                avatarUrl: user.avatarUrl,
                originalAvatarUrl: user.originalAvatarUrl,
                createdAt: user.createdAt,
                description: user.description,
            },
            token: encodeURI(`${head}.${body}.${signature}`),
        })
    })
}

exports.register = async function (req, res) {
    if (!req.body.username || !req.body.password)
        return res.status(400).json({ message: 'Fields must be not empty' })

    const username = req.body.username.toLowerCase()
    const password = req.body.password

    if (validator.isNullOrWhiteSpace(password) || validator.isNullOrWhiteSpace(username))
        return res.status(400).json({ message: 'Fields must be not empty' })

    if (!validator.validatePassword(password))
        return res.status(403).json({ message: 'Password is invalid' })

    if (!validator.validateUsername(username))
        return res.status(406).json({ message: 'Username is invalid' })

    User.findOne( {username: username}, function (err, user) {
        if (err) {
            databaseDebug(err)
            return res.status(500).json({ message: 'Internal Error' })
        }

        if (user)
            return res.status(405).json({ message: 'This username is already busy' });

        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        const newUser = new User()
        newUser.username = username
        newUser.passwordHash = passwordHash

        newUser.save(function (err) {
            if (err) {
                databaseDebug(err)
                return res.status(500).json({ message: 'Internal Error' })
            }

            return res.status(201).json({
                _id: newUser._id,
                username: newUser.username,
                avatarUrl: newUser.avatarUrl,
                originalAvatarUrl: newUser.originalAvatarUrl,
                createdAt: newUser.createdAt,
                description: newUser.description,
            });
        })
    })
}

exports.confirmJwt = function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    User.findOne( {_id: req.userId}, function (err, user) {
        if (err) {
            databaseDebug(err)
            return res.status(500).json({ message: 'Internal Error' })
        }

        if (user)
            return res.status(200).json({
                _id: user._id,
                username: user.username,
                avatarUrl: user.avatarUrl,
                originalAvatarUrl: user.originalAvatarUrl,
                createdAt: user.createdAt,
                description: user.description,
            });

        return res.status(401).json({ message: "User not registered" })
    })
}