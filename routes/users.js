const express = require('express');
const router = express.Router();

const controller = require("../controllers/users")

router.post('/search', controller.searchUsers);

module.exports = router;
