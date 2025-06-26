const express = require("express");
const router = express.Router();
const { verifyAndSyncUser } = require("../controllers/authcontroller");

router.post("/verify-sync", verifyAndSyncUser); // or "/sync" if consistent

module.exports = router;
