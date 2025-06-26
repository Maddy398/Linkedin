const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

const {
  createPost,
  getPosts,
  toggleLike,
  addComment,
  deletePost,
} = require("../controllers/postcontroller");

// Routes
router.post("/", verifyFirebaseToken, upload.single("file"), createPost);
router.get("/", verifyFirebaseToken, getPosts);
router.post("/:id/like", verifyFirebaseToken, toggleLike);
router.post("/:id/comment", verifyFirebaseToken, addComment);
router.delete("/:id", verifyFirebaseToken, deletePost);

module.exports = router;

