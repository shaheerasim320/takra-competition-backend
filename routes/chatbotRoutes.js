const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { sendMessage, clearHistory } = require("../controllers/chatbotController");

router.post("/message", protect, sendMessage);
router.delete("/history", protect, clearHistory);

module.exports = router;
