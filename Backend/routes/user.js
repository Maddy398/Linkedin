const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

const {
  createOrSyncUser,
  getProfile,
  updateProfile,
  getAllUsers,
  toggleConnection,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnections,
} = require("../controllers/usercontroller");
router.post("/", verifyFirebaseToken, createOrSyncUser);
router.get("/profile", verifyFirebaseToken, getProfile);
router.put("/profile", verifyFirebaseToken, updateProfile);
router.get("/all", verifyFirebaseToken, getAllUsers);
router.post("/connect/:id", verifyFirebaseToken, toggleConnection);
router.post("/send-request/:id", verifyFirebaseToken, sendConnectionRequest);
router.post("/accept-request/:id", verifyFirebaseToken, acceptConnectionRequest);
router.post("/reject-request/:id", verifyFirebaseToken, rejectConnectionRequest);
router.get("/connections", verifyFirebaseToken, getConnections);

module.exports = router;
