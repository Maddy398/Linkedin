const User = require("../models/User");
const multer = require("multer");
const path = require("path");

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
exports.upload = multer({ storage });

exports.createOrSyncUser = async (req, res) => {
  try {
    const { name, email, photoURL } = req.body;
    const firebaseUid = req.firebaseUid;

    let user;

    if (firebaseUid) {
      user = await User.findOne({ firebaseUid });
    }

    // Fallback by email if UID is not found
    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = new User({
        firebaseUid,
        name,
        email,
        photoURL,
      });
      await user.save();
    }

    res.status(200).json({ message: "User synced", user });
  } catch (err) {
    console.error("User sync error:", err);
    res.status(500).json({ message: "Failed to sync user" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid }).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✏️ Update user profile (bio, work, location)
exports.updateProfile = async (req, res) => {
  try {
    const { bio, work, location, description, photoURL,name } = req.body;

    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (bio !== undefined) user.bio = bio;
    if (work !== undefined) user.work = work;
    if (location !== undefined) user.location = location;
    if(description!==undefined) user.description = description;
    if (photoURL !== undefined) user.photoURL = photoURL;
    if (name !== undefined) user.name = name;

    await user.save();
    res.status(200).json({ message: "Profile updated", user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🤝 Connect or disconnect from another user
exports.toggleConnection = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    const targetUser = await User.findById(req.params.id);

    if (!user || !targetUser) return res.status(404).json({ message: "User not found" });

    const isConnected = user.connections.includes(targetUser._id);

    if (isConnected) {
      user.connections.pull(targetUser._id);
      targetUser.connections.pull(user._id);
    } else {
      user.connections.push(targetUser._id);
      targetUser.connections.push(user._id);
    }

    await user.save();
    await targetUser.save();

    res.status(200).json({
      message: isConnected ? "Disconnected" : "Connected",
    });
  } catch (err) {
    console.error("Connection error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const photoURL = `/uploads/${req.file.filename}`;
    user.photoURL = photoURL;
    await user.save();

    res.status(200).json({ message: "Photo uploaded", user });
  } catch (err) {
    console.error("Upload photo error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.sendConnectionRequest = async (req, res) => {
  try {
    const currentUser = await User.findOne({ firebaseUid: req.firebaseUid });
    const targetUser = await User.findById(req.params.id);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      currentUser.connections.includes(targetUser._id) ||
      currentUser.sentRequests.includes(targetUser._id) ||
      targetUser.connectionRequests.includes(currentUser._id)
    ) {
      return res.status(400).json({ message: "Request already sent or users already connected" });
    }

    currentUser.sentRequests.push(targetUser._id);
    targetUser.connectionRequests.push(currentUser._id);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ message: "Connection request sent" });
  } catch (err) {
    console.error("Send connection request error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.acceptConnectionRequest = async (req, res) => {
  try {
    const currentUser = await User.findOne({ firebaseUid: req.firebaseUid });
    const requester = await User.findById(req.params.id);

    if (!currentUser || !requester) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.connectionRequests.includes(requester._id)) {
      return res.status(400).json({ message: "No connection request from this user" });
    }

    currentUser.connectionRequests.pull(requester._id);
    requester.sentRequests.pull(currentUser._id);

    currentUser.connections.push(requester._id);
    requester.connections.push(currentUser._id);

    await currentUser.save();
    await requester.save();

    res.status(200).json({ message: "Connection request accepted" });
  } catch (err) {
    console.error("Accept connection request error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.rejectConnectionRequest = async (req, res) => {
  try {
    const currentUser = await User.findOne({ firebaseUid: req.firebaseUid });
    const requester = await User.findById(req.params.id);

    if (!currentUser || !requester) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.connectionRequests.includes(requester._id)) {
      return res.status(400).json({ message: "No connection request from this user" });
    }

    currentUser.connectionRequests.pull(requester._id);
    requester.sentRequests.pull(currentUser._id);

    await currentUser.save();
    await requester.save();

    res.status(200).json({ message: "Connection request rejected" });
  } catch (err) {
    console.error("Reject connection request error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const currentUser = await User.findOne({ firebaseUid: req.firebaseUid }).populate('connections sentRequests connectionRequests');
    const users = await User.find({ firebaseUid: { $ne: req.firebaseUid } });

    const userList = users.map(user => {
      let status = "none";
      if (currentUser.connections.some(conn => conn._id.equals(user._id))) {
        status = "connected";
      } else if (currentUser.sentRequests.some(req => req._id.equals(user._id))) {
        status = "pending";
      } else if (currentUser.connectionRequests.some(req => req._id.equals(user._id))) {
        status = "incoming";
      }

      return {
        _id: user._id,
        name: user.name,
        photoURL: user.photoURL,
        status
      };
    });

    res.status(200).json({ users: userList });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// controllers/userController.js
exports.getConnections = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid }).populate("connections", "name _id");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ connections: user.connections });
  } catch (err) {
    console.error("Error fetching connections:", err);
    res.status(500).json({ message: "Server error" });
  }
};



