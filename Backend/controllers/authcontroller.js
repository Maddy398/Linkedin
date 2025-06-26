const admin = require("firebase-admin");
const User = require("../models/User");

exports.verifyAndSyncUser = async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  try {
    // 🔍 Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, name = "Unnamed", email = "no-email@example.com", picture } = decoded;

    // 🔎 Check if user exists
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // 🆕 Create new user
      user = new User({
        firebaseUid: uid,
        name,
        email,
        photoURL: picture || "", // If your schema supports it
      });
      await user.save();
    }

    // ✅ Return user info
    return res.status(200).json({
      message: "User verified and synced",
      user,
    });

  } catch (err) {
    console.error("Firebase verification error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

