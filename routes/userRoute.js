const express = require("express")
const router = express.Router();
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const auth = require("./../auth.js");
const User = require("./../models/userSchema.js");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

//see all users
router.get("/profiles/all", async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        if (users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        console.log("Users displayed");
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//search user by id
router.get("/profile/search/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findOne({ id: userId }).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" + err.message });
    }
});

//search user by username
router.get("/profile/search/:username", async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username: username }).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" + err.message });
    }
});

//signin
router.post("/register", upload.single("profilePic"), async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ message: "Please enter user data" });
        }
        if (!data.id || !data.username || !data.password) {
            return res.status(400).json({ message: "ID, username and password are required" });
        }
        const newUser = new User({
            ...data,
            profilePic: req.file ? `/uploads/${req.file.filename}` : null
        });
        await newUser.save();
        console.log("User registered");
        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "User already exists" });
        }
        res.status(500).json({ error: "Internal server error" + err.message });
    }
});

//user login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const payload = {
            id: user.id,
            role: user.role,
            username: user.username
        }
        const token = jwt.sign(payload, 'lalala1122');
        res.json({ token: token });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

//update profile
router.put("/update/:id", auth, upload.single("profilePic"), async (req, res) => {
    if (req.user.role !== 'user' && req.user.id !== req.params.id) {
        return res.status(403).json({ message: "You can update only your profile" });
    }
    try {
        const userId = req.params.id;
        const updates = req.body;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        if (req.file) {
            updates.profilePic = `/uploads/${req.file.filename}`;
        }
        if (updates.password) {
            const hashedPassword = await bcrypt.hash(updates.password, 10);
            updates.password = hashedPassword;
        }
        const updatedUser = await User.findOneAndUpdate({ id: userId }, updates, {
            new: true,
            runValidators: true
        }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "Username already taken" });
        }
        res.status(500).json({ error: err.message });
    }
});

//deleting user
router.delete("/delete/:id",auth, async (req, res) => {
    if (req.user.role !=='admin' || req.user.role !== 'user' && req.user.id !== req.params.id) {
        return res.status(403).json({ message: "You can delete only your profile" });
    }
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const deletedUser = await User.findOneAndDelete({ id: userId });
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" + err.message });
    }
});

//follow user
router.put("/follow/:id", auth, async (req, res) => {
    if(req.user.id === req.params.id){
        return res.status(400).json({ message: "You cannot follow yourself.. :( " });
    }
    if(req.user.role !== 'user'){
        return res.status(403).json({ message: "Only users can follow others, Guests and Admins are not allowed.. :| " });
    }
    try {
        const userIdToFollow = req.params.id;
        const currentUserId = req.user.id;
        const userToFollow = await User.findOne({ id: userIdToFollow });
        const currentUser = await User.findOne({ id: currentUserId });
        if (!userToFollow) {
            return res.status(404).json({ message: "User not found" });
        }
        if (currentUser.following.includes(userIdToFollow)) {
            return res.status(400).json({ message: "You are already following this user" });
        }
        await User.updateOne({ id: currentUserId }, { $push: { following: userIdToFollow } });
        await User.updateOne({ id: userIdToFollow }, { $push: { followers: currentUserId } });
        res.status(200).json({ message: "User followed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//unfollow user
router.put("/unfollow/:id", auth, async (req, res) => {
    if(req.user.id === req.params.id){
        return res.status(400).json({ message: "You cannot unfollow yourself.. :( " });
    }
    if(req.user.role !== 'user'){
        return res.status(403).json({ message: "Only users can unfollow others, Guests and Admins are not allowed.. :| " });
    }
    try {
        const userIdToUnfollow = req.params.id;
        const currentUserId = req.user.id;
        const userToUnfollow = await User.findOne({ id: userIdToUnfollow });
        const currentUser = await User.findOne({ id: currentUserId });
        if (!userToUnfollow) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!currentUser.following.includes(userIdToUnfollow)) {
            return res.status(400).json({ message: "You are not following this user.. :)" });
        }
        await User.updateOne({ id: currentUserId }, { $pull: { following: userIdToUnfollow } });
        await User.updateOne({ id: userIdToUnfollow }, { $pull: { followers: currentUserId } });
        res.status(200).json({ message: "user unfollowed successfully.. :)" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;