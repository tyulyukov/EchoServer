const Chat = require('../database/models/chat')
const root = require('../bin/www.js')

exports.getUserChats = function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    const userId = req.userId

    Chat.find({ sender: userId }, 'sender receiver createdAt')
        .populate('sender')
        .populate('receiver')
        .exec(function (err, senderChats) {
            if (err)
                return res.status(500).json({ message: "Internal Error" })

            Chat.find({ receiver: userId }, 'sender receiver createdAt')
                .populate('sender')
                .populate('receiver')
                .exec(function (err, receiverChats) {
                if (err)
                    return res.status(500).json({ message: "Internal Error" })

                return res.status(200).json(senderChats.concat(receiverChats))
            })
        })
}

exports.createChat = function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    let userId = req.userId;
    let receiverId = req.body.receiverId

    Chat.findOne({ sender: userId, receiver: receiverId }, 'sender receiver createdAt')
        .populate('sender')
        .populate('receiver')
        .exec(function (err, chat) {
            if (err)
                return res.status(500).json({ message: "Internal Error" })

            if (chat)
                return res.status(201).json(chat)

            Chat.findOne({ sender: receiverId, receiver: userId }, 'sender receiver createdAt')
                .populate('sender')
                .populate('receiver')
                .exec(function (err, anotherChat) {
                    if (err)
                        return res.status(500).json({ message: "Internal Error" })

                    if (anotherChat)
                        return res.status(201).json(anotherChat)

                    const newChat = new Chat()
                    newChat.sender = userId
                    newChat.receiver = receiverId
                    newChat.messages = []

                    newChat.save(function (err) {
                        if (err)
                            return res.status(500).json({ message: "Internal Error" })

                        Chat.populate(newChat, { path: "sender" }, function(err, senderPopulatedChat) {
                            if (err)
                                return res.status(500).json({ message: "Internal Error" })

                            Chat.populate(senderPopulatedChat, { path: "receiver" }, function(err, receiverPopulatedChat) {
                                if (err)
                                    return res.status(500).json({ message: "Internal Error" })

                                for (const onlineUser of root.getOnlineUsers())
                                    if (onlineUser.userId == receiverId)
                                        onlineUser.socket.emit('chat created', receiverPopulatedChat)

                                return res.status(201).json(receiverPopulatedChat);
                            });
                        });
                    })
                })
        })
}