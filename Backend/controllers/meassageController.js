const Message = require("../models/Message");
const User = require("../models/User");

exports.sendMessage = async (req, res) => {
  try {
    const sender = await User.findOne({ firebaseUid: req.firebaseUid });
    const receiver = await User.findById(req.params.recipientId); // still keep route param name

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const isConnected = sender.connections.includes(receiver._id.toString());
    if (!isConnected) {
      return res.status(403).json({ message: "Not connected with this user" });
    }

    const { text } = req.body;

    const message = new Message({
      sender: sender._id,
      receiver: receiver._id, // ✅ use "receiver" here
      text,
    });

    await message.save();

    res.status(201).json({ message: "Message sent", data: message });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid });
    const targetUser = await User.findById(req.params.userId);
    if (!user || !targetUser) return res.status(404).json({ message: "User not found" });

    const messages = await Message.find({
      $or: [
        { sender: user._id, receiver: targetUser._id },
        { sender: targetUser._id, receiver: user._id },
      ],
    })
      .sort("createdAt")
      .populate("sender", "name"); // ✅ populate the sender's name

    // ✅ Format the response to include sender ID and name
    const formattedMessages = messages.map((msg) => ({
      text: msg.text,
      sender: msg.sender._id.toString(),
      senderName: msg.sender.name,
    }));

    res.json({ messages: formattedMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

