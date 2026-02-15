const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:3000", "https://takra-competition.vercel.app", process.env.CLIENT_URL].filter(Boolean),
            credentials: true,
        },
    });

    // JWT authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.split(" ")[1];

            if (!token) {
                return next(new Error("Authentication error — no token"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("name email role avatar");
            if (!user) {
                return next(new Error("Authentication error — user not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error("Authentication error — invalid token"));
        }
    });

    io.on("connection", async (socket) => {
        console.log(`🔌 User connected: ${socket.user.name} (${socket.user._id})`);

        // Update user online status
        await User.findByIdAndUpdate(socket.user._id, { isOnline: true });

        // Broadcast online status
        io.emit("userOnline", { userId: socket.user._id, name: socket.user.name });

        // Join personal room
        socket.join(`user_${socket.user._id}`);

        // ─── Join Chat Room ──────────────────────────────────────────────────
        socket.on("joinRoom", (roomId) => {
            socket.join(roomId);
            console.log(`${socket.user.name} joined room: ${roomId}`);
        });

        // ─── Leave Chat Room ─────────────────────────────────────────────────
        socket.on("leaveRoom", (roomId) => {
            socket.leave(roomId);
        });

        // ─── Send Message ────────────────────────────────────────────────────
        socket.on("sendMessage", async (data) => {
            try {
                const { roomId, content, receiverId } = data;

                const message = await Message.create({
                    sender: socket.user._id,
                    receiver: receiverId || null,
                    chatRoom: roomId,
                    content,
                });

                const populated = await Message.findById(message._id)
                    .populate("sender", "name avatar role")
                    .populate("receiver", "name avatar role");

                // Send to everyone in the room
                io.to(roomId).emit("receiveMessage", populated);
            } catch (error) {
                console.error("sendMessage error:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // ─── Typing Indicator ────────────────────────────────────────────────
        socket.on("typing", (data) => {
            socket.to(data.roomId).emit("userTyping", {
                userId: socket.user._id,
                name: socket.user.name,
                isTyping: data.isTyping,
            });
        });

        // ─── Mark Messages as Read ───────────────────────────────────────────
        socket.on("markRead", async (data) => {
            await Message.updateMany(
                { chatRoom: data.roomId, sender: { $ne: socket.user._id }, read: false },
                { read: true }
            );
            io.to(data.roomId).emit("messagesRead", {
                roomId: data.roomId,
                readBy: socket.user._id,
            });
        });

        // ─── Disconnect ──────────────────────────────────────────────────────
        socket.on("disconnect", async () => {
            console.log(`❌ User disconnected: ${socket.user.name}`);
            await User.findByIdAndUpdate(socket.user._id, { isOnline: false });
            io.emit("userOffline", { userId: socket.user._id });
        });
    });

    return io;
};

module.exports = initializeSocket;
