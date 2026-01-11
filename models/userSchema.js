const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    type: { type: String, enum: ["admin", "user"], default: "user", required: true },
    name: { type: String, default: "" },
    password: { type: String, required: true },
    bio: { type: String },
    profilePic: { type: String },
    gender: { type: String, enum: ["male", "female"] },
    age: { type: Number },
    interests: { type: [String], enum: ["comedy", "sports", "fashion", "business"] },
    followers: { type: [String], default: [] },
    following: { type: [String], default: [] },
    posts: { type: [String], default: [] }
}, { collection: "users" });

userSchema.pre('save', async function (next) {
    const person = this;
    if (!person.isModified('password')) {
        return next();
    }
    try {
        const hashedPassword = await bcrypt.hash(person.password, 10);
        person.password = hashedPassword;
        next();
    } catch (err) {
        return next(err);
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;