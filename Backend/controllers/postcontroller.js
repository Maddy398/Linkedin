const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/comment");
const fs = require("fs");

// Utility to ensure URL paths are valid
function ensureLeadingSlash(p) {
  return p.startsWith("/") ? p : `/${p}`;
}

// 📝 Create a new post
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const user = await User.findOne({ firebaseUid: req.firebaseUid });

    if (!user) return res.status(404).json({ message: "User not found" });

    let imagePath = null;
    let filePath = null;

    if (req.file) {
      const urlPath = `/uploads/${req.file.filename}`;

      if (req.file.mimetype.startsWith("image/")) {
        imagePath = urlPath;
      } else {
        filePath = urlPath;
      }
    }

    const post = new Post({
      user: user._id,
      content,
      image: imagePath,
      file: filePath,
    });

    await post.save();
    res.status(201).json({ message: "Post created", post });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// 📰 Get all posts with transformed structure
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "name firebaseUid")
      .lean();

    const postIds = posts.map((post) => post._id);
    const allComments = await Comment.find({ post: { $in: postIds } })
      .populate("user", "name firebaseUid")
      .lean();

    const commentsByPost = {};
    allComments.forEach((comment) => {
      const postId = comment.post.toString();
      if (!commentsByPost[postId]) commentsByPost[postId] = [];

      commentsByPost[postId].push({
        name: comment.user.name,
        text: comment.text,
      });
    });

    const transformed = posts.map((post) => ({
      _id: post._id,
      content: post.content,
      createdAt: post.createdAt,
      author: {
        name: post.user.name,
        uid: post.user.firebaseUid,
      },
      fileUrl: post.file
        ? `${req.protocol}://${req.get("host")}${ensureLeadingSlash(post.file)}`
        : post.image
        ? `${req.protocol}://${req.get("host")}${ensureLeadingSlash(post.image)}`
        : null,
      likes: post.likes || [],
      comments: commentsByPost[post._id.toString()] || [],
    }));

    res.status(200).json(transformed);
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🔁 Raw getAllPosts (with full population)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name photoURL")
      .populate({
        path: "comments",
        populate: { path: "user", select: "name photoURL" },
      });

    res.status(200).json(posts);
  } catch (err) {
    console.error("Get all posts error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 👍 Like or unlike post
exports.toggleLike = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    const post = await Post.findById(req.params.id);

    if (!user || !post) return res.status(404).json({ message: "Not found" });

    const hasLiked = post.likes.includes(user._id);
    hasLiked ? post.likes.pull(user._id) : post.likes.push(user._id);
    await post.save();

    res.status(200).json({ message: hasLiked ? "Unliked" : "Liked" });
  } catch (err) {
    console.error("Toggle like error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 💬 Add a comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    const post = await Post.findById(req.params.id);

    if (!user || !post) return res.status(404).json({ message: "Not found" });

    const comment = new Comment({ user: user._id, post: post._id, text });
    await comment.save();

    res.status(201).json({ message: "Comment added", comment });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🗑️ Delete a post
exports.deletePost = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    const post = await Post.findById(req.params.id);

    if (!user || !post) return res.status(404).json({ message: "Post not found" });
    if (!post.user.equals(user._id)) return res.status(403).json({ message: "Not authorized" });

    // Optional cleanup: delete associated file/image
    const filePath = post.file || post.image;
    if (filePath && fs.existsSync("." + filePath)) {
      fs.unlinkSync("." + filePath);
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
