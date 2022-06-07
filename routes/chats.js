const express = require('express');
const router = express.Router();

const controller = require("../controllers/chats")

router.get('/', controller.getUserChats);
router.post('/create', controller.createChat)

module.exports = router;
