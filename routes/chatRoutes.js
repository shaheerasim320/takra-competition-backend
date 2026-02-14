const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { getChatHistory, getActiveChatRooms } = require("../controllers/chatController");

// Get active chat rooms (admin/support only)
router.get("/rooms", protect, authorize("admin", "support"), getActiveChatRooms);

// Get chat history for a specific room
router.get("/:roomId", protect, getChatHistory);

module.exports = router;
