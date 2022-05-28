const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const attachment = new Schema({
    name: String,
    fileType: String,
    url: String,
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("Attachment", attachment)