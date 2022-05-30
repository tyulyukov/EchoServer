const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const user = new Schema({
    username: String,
    passwordHash: String,
    description: String,
    avatarUrl: {
        type: String,
        default: 'storage/avatars/default-avatar.webp',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("User", user)