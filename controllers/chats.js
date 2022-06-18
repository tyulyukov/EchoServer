const Chat = require('../database/models/chat')
const Message = require('../database/models/message')
const root = require('../bin/root')

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
                .exec(async function (err, receiverChats) {
                    if (err)
                        return res.status(500).json({message: "Internal Error"})

                    let chats = senderChats.concat(receiverChats);

                    for (let i = 0; i < chats.length; i++) {
                        let targetUserId
                        if (chats[i].sender._id.toString() !== userId.toString())
                            targetUserId = chats[i].sender._id
                        else
                            targetUserId = chats[i].receiver._id

                        let unreadMessagesCount = await Message.countDocuments({
                            chat: chats[i]._id,
                            haveSeen: false,
                            sender: targetUserId
                        });

                        let loadedMessages = await Message.findOne({ chat: chats[i] })
                            .sort({'sentAt': -1})
                            .populate({ path : 'chat', populate : { path : 'sender receiver' } })
                            .populate('repliedOn')
                            .populate('attachments')
                            .populate('sender')

                        chats[i] = {
                            _id: chats[i]._id,
                            createdAt: chats[i].createdAt,
                            sender: chats[i].sender,
                            receiver: chats[i].receiver,
                            unreadMessagesCount: unreadMessagesCount,
                            messages: []
                        }

                        if (loadedMessages)
                            chats[i].messages = [loadedMessages]
                    }

                    return res.status(200).json(chats)
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

exports.loadMessages = function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    Message.find({chat: req.params.chatId})
        .sort({'sentAt': -1})
        .limit(req.query.count)
        .skip(req.query.from)
        .populate({ path : 'chat', populate : { path : 'sender receiver' } })
        .populate('repliedOn')
        .populate('attachments')
        .populate('sender')
        .exec( function (err, messages) {
            if (err)
                return res.status(500).json({ message: "Internal Error" });

            return res.status(200).json(messages);
        });
}