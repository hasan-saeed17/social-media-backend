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
      userId: req.user.id.toString(), 
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
    const id = req.params.postId;
    const comments = await Comment.find({ postId: id });

    if (comments.length === 0) {
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
    const pId = req.params.id;
    const comment = await Comment.findById(pId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId.toString() !== req.user.id) {
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
    const cId = req.params.id;
    const comment = await Comment.findById(cId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (
      comment.userId.toString() !== req.user.id &&
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
    const { userId } = req.body;

    const comment = await Comment.findById(req.params.id);

    if (!comment.likes.includes(userId)) {
      comment.likes.push(userId);
    } else {
      comment.likes.pull(userId);
    }

    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;