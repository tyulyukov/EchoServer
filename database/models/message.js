const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const message = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    content: String,
    edits: [{
        content: String,
        date: {
            type: Date,
            default: Date.now,
        }
    }],
    isSeen: {
        type: Boolean,
        default: false
    },
    attachments: {
        type: Schema.Types.ObjectId,
        ref: 'Attachment'
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
    repliedOn: {
        type: Schema.Types.ObjectId,
        ref: 'Message'
    }
});

module.exports = mongoose.model("Message", message)