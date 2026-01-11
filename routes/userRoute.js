const express = require("express")
const router = express.Router();
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
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
router.get("/all", async (req, res) => {
    try {
        const users = await User.find({});
        if (users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        console.log("Users displayed");
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
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

//update profile
router.put("/update/:id", upload.single("profilePic"), async (req, res) => {
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



module.exports = router;