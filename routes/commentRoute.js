const express = require("express");
const router = express.Router();
const Comment = require("../models/commentSchema");
const auth = require("./../auth.js");


// write a comment
router.post("/add", auth, async (req, res) => {
  try {
    const { description, postId } = req.body;

    const comment = new Comment({
      description,
      postId,             
      userId: req.user.id, 
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// see coments on a post
router.get("/post/:postId", auth, async (req, res) => {
  try {
    const comments = await Comment.find({
      postId: req.params.postId,
    });

    if (!comments.length) {
      return res.status(404).json({ message: "No comments found!" });
    }

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// edit comment
router.put("/update/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // ObjectId comparison MUST use .equals()
    if (!comment.userId.equals(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.description = req.body.description;
    await comment.save();

    res.status(200).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// del a comment
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (
      !comment.userId.equals(req.user.id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await comment.deleteOne();
    res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// like / unlike
router.put("/like/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = req.user.id;

    const alreadyLiked = comment.likes.some(id =>
      id.equals(userId)
    );

    if (!alreadyLiked) {
      comment.likes.push(userId);
    } else {
      comment.likes.pull(userId);
    }

    await comment.save();
    res.status(200).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;