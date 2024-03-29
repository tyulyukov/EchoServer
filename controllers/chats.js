const Chat = require('../database/models/chat')
const Message = require('../database/models/message')
const root = require('../bin/root')

exports.getUserChats = async function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    const userId = req.userId

    let senderChats = await Chat.find({sender: userId}, 'sender receiver createdAt')
        .populate('sender')
        .populate('receiver')
        .exec()

    if (!senderChats)
        return res.status(500).json({message: "Internal Error"})

    let receiverChats = await Chat.find({ receiver: userId }, 'sender receiver createdAt')
        .populate('sender')
        .populate('receiver')
        .exec()

    if (!receiverChats)
        return res.status(500).json({message: "Internal Error"})

    let chats = senderChats.concat(receiverChats);

    if (!chats)
        return res.status(500).json({message: "Internal Error"})

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

        let loadedMessages = await Message.find({ chat: chats[i] }, '_id sentAt editedAt content sender haveSeen edits')
            .sort({'sentAt': -1})
            .limit(1)
            .populate('sender')
            .populate({
                path : 'repliedOn',
                select : '_id content sender sentAt editedAt haveSeen',
                populate : {
                    path : 'sender',
                }
            })

        chats[i] = {
            _id: chats[i]._id,
            createdAt: chats[i].createdAt,
            sender: chats[i].sender,
            receiver: chats[i].receiver,
            unreadMessagesCount: unreadMessagesCount,
            messages: loadedMessages
        }
    }

    return res.status(200).json(chats)
}

exports.createChat = async function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    if (!req.body.receiverId) {
        return res.status(400).json({ message: "Receiver id is not passed" })
    }

    let userId = req.userId;
    let receiverId = req.body.receiverId

    let chat = await Chat.findOne({ sender: userId, receiver: receiverId }, 'sender receiver createdAt')
        .populate('sender')
        .populate('receiver')
        .exec()

    if (chat)
        return res.status(201).json(chat)

    let anotherChat = await Chat.findOne({ sender: receiverId, receiver: userId }, 'sender receiver createdAt')
        .populate('sender')
        .populate('receiver')
        .exec()

    if (anotherChat)
        return res.status(201).json(anotherChat)

    let newChat = new Chat()
    newChat.sender = userId
    newChat.receiver = receiverId
    newChat.messages = []

    newChat.save(async function (err) {
        if (err)
            return res.status(500).json({ message: "Internal Error" })

        newChat = await Chat.populate(newChat, { path: "sender" })

        if (!newChat)
            return res.status(500).json({ message: "Internal Error" })

        newChat = await Chat.populate(newChat, { path: "receiver" });

        if (!newChat)
            return res.status(500).json({ message: "Internal Error" })

        for (const onlineUser of root.getOnlineUsers())
            if (onlineUser.userId == receiverId)
                onlineUser.socket.emit('chat created', newChat)

        return res.status(201).json(newChat);
    });
}

exports.loadMessages = async function (req, res) {
    if (!req.userId)
        return res.status(401).json({ message: "Not authorized" })

    if (!req.params.chatId || !req.query.count || !req.query.from)
        return res.status(400).json({ message: "Fields must be not empty" })

    const chatId = req.params.chatId
    const count = req.query.count || 15
    const from = req.query.from || 0

    let chat = await Chat.findById(chatId).exec()

    if (!chat)
        return res.status(404).json({ message: "Chat not found" })

    if (chat.sender.toString() !== req.userId && chat.receiver.toString() !== req.userId)
        return res.status(403).json({ message: "User is not in this chat" })

    Message.find({ chat: chatId }, '_id content repliedOn sender sentAt editedAt edits haveSeen')
        .sort({ 'sentAt': -1 })
        .limit(count)
        .skip(from)
        .populate({
            path : 'repliedOn',
            select : '_id content sender sentAt editedAt haveSeen',
            populate : {
                path : 'sender',
            }
        })
        .populate('sender')
        .exec( function (err, messages) {
            if (err)
                return res.status(500).json({ message: "Internal Error" });

            return res.status(200).json(messages);
        });
}