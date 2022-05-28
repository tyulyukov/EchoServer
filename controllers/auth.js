let crypto = require('crypto')
const tokenKey = process.env.TOKEN_KEY

const User = require('../database/models/user')

exports.middlewareAuth = function (req, res, next) {
    if (req.headers.authorization) {
        let tokenParts = req.headers.authorization.split('.')
        let signature = crypto
            .createHmac('SHA256', tokenKey)
            .update(`${tokenParts[0]}.${tokenParts[1]}`)
            .digest('base64')

        if (signature === tokenParts[2])
            req.user = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'))
    }

    return next()
}

exports.login = async function (req, res){
    const username = req.body.username
    const passwordHash = crypto.createHash('sha256').update(req.body.password).digest('hex');

    User.findOne( {username: username, passwordHash: passwordHash}, function (err, user) {
        if (err) {
            console.error(err)
            return res.status(500).json({ message: 'Internal Error' })
        }

        if (!user)
            return res.status(400).json({ message: 'User Not Found' })

        let head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'jwt' })).toString('base64')
        let body = Buffer.from(JSON.stringify(user)).toString('base64')
        let signature = crypto.createHmac('SHA256', tokenKey).update(`${head}.${body}`).digest('base64')

        return res.status(200).json({
            User: {
                Username: user.username,
                AvatarUrl: user.avatarUrl,
                CreatedAt: user.createdAt
            },
            Token: `${head}.${body}.${signature}`,
        })
    })
}

exports.register = async function (req, res){
    const username = req.body.username
    const password = req.body.password

    if (IsNullOrWhiteSpace(password) || IsNullOrWhiteSpace(username)) {
        return res.status(400).json({message: 'Fields must be not empty'})
    }

    User.findOne( {username: username}, function (err, user) {
        if (err) {
            console.error(err)
            return res.status(500).json({message: 'Internal Error'})
        }

        if (user) {
            return res.status(405).json({ message: 'This username is already busy' });
        }

        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
        if(password.match(passwordRegex) == null)
            return res.status(400).json({ message: 'Password is incorrect' });

        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        const newUser = new User()
        newUser.username = username
        newUser.passwordHash = passwordHash

        newUser.save(function (err) {
            if (err)
                return res.status(500).json({ message: 'Internal Error' })

            return res.status(201).json({
                Username: newUser.username,
                AvatarUrl: newUser.avatarUrl,
                CreatedAt: newUser.createdAt
            });
        })
    })
}

function IsNullOrWhiteSpace(str) {
    return str == null || str.trim() === ''
}