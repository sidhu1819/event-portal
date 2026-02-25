const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true
    },

    // ✅ FIXED PASSWORD FIELD
    password: {
        type: String,
        default: null
    },

    needSystem: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: "participant"
    },
    status: {
        type: String,
        default: "pending"
    },
    githubLink: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);