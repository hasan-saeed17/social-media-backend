const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    type: { type: String, enum: ["admin", "user"], default: "user", required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    bio: { type: String },
    profilePic: { type: String },
    gender: { type: String, enum: ["male", "female"] },
    age: { type: Number },
    interests: { type: [String], enum: ["comedy", "sports", "fashion", "business"] },
    followers: { type: [String], default: [] },
    following: { type: [String], default: [] },
    posts: { type: [String], default: [] }
}, { collections: "users" }
)
const User = mongoose.model("User", userSchema);
module.exports = User;