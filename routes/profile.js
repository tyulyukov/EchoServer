const express = require('express');
const router = express.Router();

const controller = require("../controllers/profile")

router.post('/update/avatar', controller.updateAvatar);
router.post('/update/username', controller.updateUsername);
router.post('/update/password', controller.updatePassword);

module.exports = router;
