const express = require('express');
const router = express.Router();

const controller = require("../controllers/media-converter")

router.post('/upload', controller.uploadImage);
/*router.post('/upload/avatar', controller.uploadAvatar);*/

module.exports = router;
