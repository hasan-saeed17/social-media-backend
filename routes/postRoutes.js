const express = require('express');
const router = express.Router();

const auth = require('./../auth');
const Post = require('./../models/postSchema');
const Comment = require('./../models/commentSchema')
const User = require('./../models/userSchema')

const multer = require('multer')
const path = require('path')


const storage = multer.diskStorage({
    destination: function (req,file,cb) {
        cb(null, "../uploads/posts");
    },
    filename: function (req,file,cb) {
        cb(null, Date.now() + "-post-" + file.originalname);
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files allowed"), false);
    }
}

const upload = multer({ storage: storage, fileFilter: fileFilter });



//create post
router.post("/create", auth, upload.single("image"), async (req, res) => {

    try {

        const { type, contentType, content } = req.body;

        if (!type || !contentType) {
            return res.status(400).json({ message: "All fields are required." })
        }

        // validate post type
        const validTypes = ["comedy", "sports", "fashion", "business", "tech"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: "Invalid post type." });
        }

        // TEXT POST
        if (contentType === "text") {

            if (!content) {
                return res.status(400).json({ message: "Text content is required." });
            }

            const post = new Post({
                userId: req.user.id,
                type,
                contentType: "text",
                content
            });

            await post.save();

            await User.findByIdAndUpdate(req.user.id, {
                $push: { posts: post.id }
            });

            return res.status(201).json({
                message: "Post created successfully",
                data: post
            });

        } else if (contentType === "image") {

            if (!req.file) {
                return res.status(400).json({ message: "Image file is required." });
            }

            const imagePath = `/uploads/posts/${req.file.filename}`;

            const post = new Post({
                userId: req.user.id,
                type,
                contentType: "image",
                content: imagePath
            });

            await post.save();

            await User.findByIdAndUpdate(req.user.id, {
                $push: { posts: post.id }
            });
            
            return res.status(201).json({
                message: "Post created successfully",
                data: post
            });

        }
         
        return res.status(400).json({ message: "Invalid content type." });


    } catch (error) {
        res.status(500).json({
            message: "Internal server error.",
            error:error
        });
    }

})


//get feed
router.get('/get-feed', async (req, res) => {

    try {

        const posts = await Post.find().sort({ datePosted: -1 }).populate("userId", "username profilePic");

        const feed = [];

        for (const post of posts) {

            const comments = await Comment.find({ postId: post._id })
                .sort({ createdAt: -1 })
                .populate("userId", "username profilePic")

            feed.push({
                ...post.toObject(),
                comments
            })

        }

        res.status(200).json({
            message: "Feed fetched successfully",
            feed: feed
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal server error."
        });
    }

})


//get logged-in user posts
router.get('/myPosts', auth, async (req, res) => {

    try {

        const posts = await Post.find({ userId: req.user._id })
            .sort({ datePosted: -1 })
            .populate("userId", "username profilePic")

        const feed = []

        for (const post of posts) {

            const comments = await Comment.find({ postId: post._id })
                .sort({ createdAt: -1 })
                .populate("userId", "username profilePic")

            feed.push({
                ...post.toObject(),
                comments
            });
        }

        res.status(200).json({
            message: "Logged-in user posts fetched successfully",
            feed: feed
        });


    } catch (error) {
        res.status(500).json({
            message: "Internal server error."
        })
    }

})


//update post
router.put('/update/:postId', auth, upload.single("image"), async (req, res) => {

    try {

        const { postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            })
        }

        if (post.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to update this post"
            })
        }

        const { type, contentType, content } = req.body;

        const validTypes = ["comedy", "sports", "fashion", "business", "tech"];
        if (type && !validTypes.includes(type)) {
          return res.status(400).json({ message: "Invalid post type" });
        }
        if (type) {
            post.type = type;
        }



        // TEXT UPDATE
        if (contentType === "text") {
          if (content) {
            post.contentType = contentType;
            post.content = content;
          }
        }

        // IMAGE UPDATE (replace image)
        if (contentType === "image") {
          if (req.file) {
            post.contentType = contentType; 
            post.content = `/uploads/posts/${req.file.filename}`;
          }
        }


        const updatedPost = await post.save();

        res.status(200).json({
            message: "Post updated successfully",
            post: updatedPost
        })

    } catch (error) {
        res.status(500).json({
            message: "Internal server error."
        })
    }

})


//delete post
router.delete('/delete/:postId', auth, async (req, res) => {

    try {

        const { postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found."
            })
        }

        if (post.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to delete this post."
            });
        }

        await User.findByIdAndUpdate(req.user._id, {
          $pull: { posts: post._id }
        });

        await Comment.deleteMany({ postId: post._id });
        await post.deleteOne();

        res.status(200).json({
            message: "Post deleted successfully."
        })

    } catch (error) {
        res.status(500).json({
            message: "Internal server error."
        })
    }


})


//like post
router.post('/:postId/like', auth, async (req, res) => {

    try {

        const { postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }

        let alreadyLiked = false;

        for (let i = 0; i < post.likes.length; i++) {

            if (post.likes[i].toString() === req.user._id.toString()) {
                alreadyLiked = true;
                break;
            }
        }

        if (alreadyLiked) {
            return res.status(400).json({ message: "Post already liked" })
        }


        post.likes.push(req.user._id);
        const updatedPost = await post.save();

        res.status(200).json({
            message: "Post liked successfully",
            post: updatedPost
        })


    } catch (error) {
        res.status(500).json({
            message: "Internal server error."
        })
    }

})


//unlike post
router.post('/:postId/unlike', auth, async (req, res) => {

    try {

        const { postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }

        let likeIndex = -1;

        for (let i = 0; i < post.likes.length; i++) {
            if (post.likes[i].toString() === req.user._id.toString()) {
                likeIndex = i;
                break;
            }
        }

        if (likeIndex === -1) {
            return res.status(400).json({ message: "Post not liked yet" })
        }

        post.likes.splice(likeIndex, 1);

        const updatedPost = await post.save();

        res.status(200).json({
            message: "Post unliked successfully",
            post: updatedPost
        })

    } catch (error) {
        res.status(500).json({
            message: "Internal server error"
        })
    }

})

module.exports = router;