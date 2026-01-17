const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    role: { type: String, enum: ["admin", "user"], default: "user", required: true },
    name: { type: String, default: "" },
    password: { type: String, required: true },
    email: { type: String, unique: true },
    bio: { type: String },
    profilePic: { type: String },
    gender: { type: String, enum: ["male", "female"], default: "male" },
    age: { type: Number },
    interests: [{ type: String, enum: ["comedy", "sports", "fashion", "business", "tech"] }],
    followers: { type: [String], default: [] },
    following: { type: [String], default: [] },
    posts: { type: [String], default: [] }
}, { collection: "users" });

userSchema.pre('save', async function () {
    const person = this;
    if (!person.isModified('password')) {
        return;
    }
    try {
        const hashedPassword = await bcrypt.hash(person.password, 10);
        person.password = hashedPassword;
    } catch (err) {
        return;
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;