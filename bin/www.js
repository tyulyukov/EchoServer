let app = require('../app');
let debug = require('debug')('echoserver:server');
let http = require('http');
let mongoose = require("mongoose");

require("dotenv").config();
const tokenKey = process.env.TOKEN_KEY

let port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

let server = http.createServer(app);
let { Server } = require("socket.io");
const crypto = require("crypto");
let io = new Server(server, {
  cors: {
    origin: "*",
  }
});

mongoose.connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, function (err) { if (err) console.error(err) } )

const Message = require('../database/models/message');
const Chat = require("../database/models/chat");

io.use((socket, next) => {
  const authorization = socket.handshake.query.authorization.replace(' ', '+');

  if (!authorization)
    return next(new Error("401"));

  let tokenParts = authorization.split('.')
  let signature = crypto
      .createHmac('SHA256', tokenKey)
      .update(`${tokenParts[0]}.${tokenParts[1]}`)
      .digest('base64')

  if (signature === tokenParts[2])
    socket.userId = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'))

  next();
});

let onlineUsers = [];
exports.getOnlineUsers = function () {
  return onlineUsers;
}
io.on('connection', function(socket) {
  console.log('CONNECT', socket.userId, 'SOCKET', socket.id)

  onlineUsers = [];
  for (let [id, userSocket] of io.of("/").sockets) {
    onlineUsers.push({
      socket: userSocket,
      userId: userSocket.userId,
    });
  }

  let onlineUsersId = [];
  for (const user of onlineUsers)
    if (user.userId !== socket.userId) {
      user.socket.emit('user connected', socket.userId)
      onlineUsersId.push(user.userId)
    }

  socket.emit('users online', onlineUsersId);

  socket.on('send message', function(messageId, chatId, content) {
    let message = new Message()
    message._id = messageId
    message.chat = chatId
    message.sender = socket.userId
    message.content = content

    message.save(function(err) {
      if (err)
        return socket.emit('send message failed', messageId)

      Message.populate(message, { path: "sender" }, function(err, senderPopulatedMessage) {
        if (err)
          return socket.emit('send message failed', messageId)

        Message.populate(senderPopulatedMessage, { path: "chat", populate: { path: "sender receiver" } }, function (err, chatPopulatedMessage) {
          if (err)
            return socket.emit('send message failed', messageId)

          let targetUserId

          if (chatPopulatedMessage.chat.sender._id.toString() !== socket.userId.toString())
            targetUserId = chatPopulatedMessage.chat.sender._id
          else
            targetUserId = chatPopulatedMessage.chat.receiver._id

          for (const onlineUser of onlineUsers)
            if (onlineUser.userId == socket.userId) {
              console.log('MESSAGE SEND SUCCESS', onlineUser.userId)
              onlineUser.socket.emit('message sent', chatPopulatedMessage)
            }
            else if (onlineUser.userId == targetUserId) {
              console.log('MESSAGE SENT TO', onlineUser.userId)
              onlineUser.socket.emit('message sent', chatPopulatedMessage)
            }
        })
      })
    })
  })

  socket.on('disconnect', function () {
    console.log('DISCONNECT', socket.userId, 'SOCKET', socket.id)

    for(let i = 0; i < onlineUsers.length; i++)
      if (onlineUsers[i].socket.id === socket.id)
        onlineUsers.splice(i, 1);

    for(let i = 0; i < onlineUsers.length; i++)
      if (onlineUsers[i].userId === socket.userId)
        return;

    for (const user of onlineUsers)
      if (user.socket.id !== socket.id) {
        user.socket.emit('user disconnected', socket.userId)
      }
  })
});

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;

  debug('Listening on ' + bind);

  if (addr.port)
    debug('Server started at: http://localhost:' + addr.port + '/')
}