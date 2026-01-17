const express = require("express");
const router = express.Router();
const Comment = require("./commentSchema");

// write a comment
router.post("/add", async (req, res) => {
  try {
    const { description, postId, userId } = req.body;

    const comment = new Comment({
      description,
      postId,
      userId,
    });

    await comment.save();

    res.status(200).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// see coments on a post
router.get("/post/:postId", async (req, res) => {
  try {
    const id = req.params.postId;
    const comments = await Comment.find({
      postId: id,
    });
    if (!comments) {
      res.status(404).json({ message: "No comments found!" });
    }
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// edit comment
router.put("/update/:id", async (req, res) => {
  try {
    const pId = req.params.id;
    const comment = await Comment.findById(pId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.description = req.body.description;
    await comment.save();

    res.status(200).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// del a comment
router.delete("/delete/:id", async (req, res) => {
  try {
    const cId = req.params.id;
    const comment = await Comment.findById(cId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    await comment.deleteOne();
    res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// like / unlike
router.put("/like/:id", async (req, res) => {
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