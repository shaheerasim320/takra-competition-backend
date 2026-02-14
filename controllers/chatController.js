const Message = require("../models/Message");

// @desc    Get chat history between two users
// @route   GET /api/chat/:roomId
// @access  Private
exports.getChatHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const messages = await Message.find({ chatRoom: roomId })
            .populate("sender", "name avatar role")
            .populate("receiver", "name avatar role")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Message.countDocuments({ chatRoom: roomId });

        res.status(200).json({
            success: true,
            messages: messages.reverse(),
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
        });
    } catch (error) {
        console.error("getChatHistory error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc    Get all active chat rooms (for admin/support)
// @route   GET /api/chat/rooms
// @access  Private (Admin/Support)
exports.getActiveChatRooms = async (req, res) => {
    try {
        // Get distinct chat rooms with their last message
        const rooms = await Message.aggregate([
            {
                $group: {
                    _id: "$chatRoom",
                    lastMessage: { $last: "$content" },
                    lastMessageAt: { $last: "$createdAt" },
                    sender: { $last: "$sender" },
                    unreadCount: {
                        $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] },
                    },
                },
            },
            { $sort: { lastMessageAt: -1 } },
        ]);

        // Populate sender info
        const User = require("../models/User");
        const populatedRooms = await Promise.all(
            rooms.map(async (room) => {
                const senderInfo = await User.findById(room.sender).select("name avatar role");
                return {
                    roomId: room._id,
                    lastMessage: room.lastMessage,
                    lastMessageAt: room.lastMessageAt,
                    sender: senderInfo,
                    unreadCount: room.unreadCount,
                };
            })
        );

        res.status(200).json({ success: true, rooms: populatedRooms });
    } catch (error) {
        console.error("getActiveChatRooms error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
