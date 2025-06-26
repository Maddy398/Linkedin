const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const { sendMessage, getMessages } = require("../controllers/meassageController");
router.post("/send/:recipientId", verifyFirebaseToken, sendMessage);
router.get("/:userId", verifyFirebaseToken, getMessages); // FIXED: Added colon here

module.exports = router;
