const express = require('express');
const router = express.Router();

const auth = require('./../auth');
const Post = require('./../models/postSchema');
const Comment = require('./../models/commentSchema')




//create post
router.post("/", auth, async (req, res) => {

    try {

        const { type, contentType, content } = req.body;

        if (!type || !contentType || !content) {
            return res.status(400).json({ message: "All fields are required." })
        }

        const post = new Post({
            userId: req.user._id,
            type,
            content,
            contentType
        });

        await post.save();

        res.status(201).json({
            message: "Post created successfully",
            data: post
        });


    } catch (error) {
        res.status(500).json({
            message: "Internal server error."
        });
    }

})


//get feed
router.get('/', async (req, res) => {

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
router.put('/:postId', auth, async (req, res) => {

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

        if (type) {
            post.type = type;
        }
        if (contentType) {
            post.contentType = contentType
        }
        if (content) {
            post.content = content
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
router.delete('/:postId', auth, async (req, res) => {

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