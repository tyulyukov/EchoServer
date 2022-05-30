const Chat = require('../database/models/chat')

exports.getUserChats = function (req, res) {
    if (!req.user)
        return res.status(401)

    const userId = req.user._id

    Chat.find({ sender: userId }, function (err, senderChats) {
        if (err)
            return res.status(500)

        Chat.find({ receiver: userId }, function (err, receiverChats) {
            if (err)
                return res.status(500)

            return res.status(200).json(senderChats.concat(receiverChats))
        })
    })
}

exports.createChat = function (req, res) {
    if (!req.user)
        return res.status(401)

    let userId = req.user._id;
    let receiverId = req.body.receiverId

    Chat.findOne({ sender: userId, receiver: receiverId }, function (err, chat) {
        if (err)
            return res.status(500)

        if (chat)
            return res.status(200).json(chat)

        Chat.findOne({ sender: receiverId, receiver: userId }, function (err, anotherChat) {
            if (err)
                return res.status(500)

            if (anotherChat)
                return res.status(200).json(anotherChat)

            const newChat = new Chat()
            newChat.sender = userId
            newChat.receiver = receiverId
            newChat.messages = []

            newChat.save(function (err) {
                if (err)
                    return res.status(500)

                return res.status(201).json(newChat);
            })
        })
    })


}