const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const message = new Schema({
    _id: String,
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
    haveSeen: {
        type: Boolean,
        default: false
    },
    /*attachments: [{
        type: Schema.Types.ObjectId,
        ref: 'Attachment'
    }],*/
    sentAt: {
        type: Date,
        default: Date.now,
    },
    editedAt: {
        type: Date,
        default: Date.now,
    },
    repliedOn: {
        type: String,
        ref: 'Message'
    },
    chat: {
        type: Schema.Types.ObjectId,
        ref: 'Chat'
    }
});

module.exports = mongoose.model("Message", message)