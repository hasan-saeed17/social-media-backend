const express = require("express")
const router = express.Router();
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./../auth.js");
const User = require("./../models/userSchema.js");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads/pfp"));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files allowed"), false);
    }
}

const upload = multer({ storage: storage, fileFilter: fileFilter });

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
router.get("/profile/id/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//search user by username
router.get("/profile/username/:username", async (req, res) => {
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

//signup
router.post("/register", upload.single("profilePic"), async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ message: "Please enter user data" });
        }
        if (!data.username || !data.password) {
            return res.status(400).json({ message: "Username and password are required" });
        }
        const newUser = new User({
            ...data,
            profilePic: req.file ? `/uploads/pfp/${req.file.filename}` : null
        });
        await newUser.save();
        console.log("User registered");
        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "User already exists" + err.message });
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
            return res.status(401).json({ error: 'Invalid password.' });
        }
        const payload = {
            id: user._id,
            role: user.role,
            username: user.username
        }
        const token = jwt.sign(payload, 'lalala1122');
        res.cookie('token', token, { httpOnly: true, secure: false });
        res.json({ message: 'Login successful.' });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

//user logout
router.post("/logout", auth, async (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: "Logout successful." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// reset password
router.put("/reset-password/:id", auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ message: "You can reset only your password" });
        }

        const { oldpassword, newpassword } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(oldpassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Old password incorrect" });
        }

        user.password = newpassword;
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//update profile
router.put("/update/:id", auth, upload.single("profilePic"), async (req, res) => {
    if (req.user.id !== req.params.id) {
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
            return res.status(400).json({ message: "Password cannot be updated here go to reset instead" });
        }
        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true
        });
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
router.delete("/delete/:id", auth, async (req, res) => {
    if (req.user.role === "user" && req.user.id !== req.params.id) {
        return res.status(403).json({ message: "You can delete only your own profile" });
    }

    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//follow user
router.put("/follow/:id", auth, async (req, res) => {
    if (req.user.id === req.params.id) {
        return res.status(400).json({ message: "You cannot follow yourself.. :( " });
    }
    if (req.user.role !== 'user') {
        return res.status(403).json({ message: "Only users can follow others, Guests and Admins are not allowed.. :| " });
    }
    try {
        const userIdToFollow = req.params.id;
        const currentUserId = req.user.id;
        const userToFollow = await User.findById(userIdToFollow);
        const currentUser = await User.findById(currentUserId);
        if (!userToFollow) {
            return res.status(404).json({ message: "User not found" });
        }
        if (currentUser.following.includes(userIdToFollow)) {
            return res.status(400).json({ message: "You are already following this user" });
        }
        await User.findByIdAndUpdate(currentUserId, { $push: { following: userIdToFollow } });
        await User.findByIdAndUpdate(userIdToFollow, { $push: { followers: currentUserId } });
        res.status(200).json({ message: "User followed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//unfollow user
router.put("/unfollow/:id", auth, async (req, res) => {
    if (req.user.id === req.params.id) {
        return res.status(400).json({ message: "You cannot unfollow yourself.. :( " });
    }
    if (req.user.role !== 'user') {
        return res.status(403).json({ message: "Only users can unfollow others, Guests and Admins are not allowed.. :| " });
    }
    try {
        const userIdToUnfollow = req.params.id;
        const currentUserId = req.user.id;
        const userToUnfollow = await User.findById(userIdToUnfollow);
        const currentUser = await User.findById(currentUserId);
        if (!userToUnfollow) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!currentUser.following.includes(userIdToUnfollow)) {
            return res.status(400).json({ message: "You are not following this user.. :)" });
        }
        await User.findByIdAndUpdate(currentUserId, { $pull: { following: userIdToUnfollow } });
        await User.findByIdAndUpdate(userIdToUnfollow, { $pull: { followers: currentUserId } });
        res.status(200).json({ message: "user unfollowed successfully.. :)" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;