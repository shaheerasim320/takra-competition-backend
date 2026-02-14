const User = require("../models/User");
const bcrypt = require("bcryptjs");

// @desc    Get current user's registered competitions
// @route   GET /api/users/my-competitions
// @access  Private
exports.getMyCompetitions = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: "registeredCompetitions",
            populate: { path: "category", select: "name" },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Also get status from competition participants array
        const Competition = require("../models/Competition");
        const competitions = await Competition.find({
            "participants.user": req.user._id,
        }).populate("category", "name");

        const result = competitions.map((comp) => {
            const participant = comp.participants.find(
                (p) => p.user.toString() === req.user._id.toString()
            );
            return {
                _id: comp._id,
                title: comp.title,
                description: comp.description,
                category: comp.category,
                startDate: comp.startDate,
                endDate: comp.endDate,
                registrationStatus: participant?.status || "unknown",
                registeredAt: participant?.registeredAt,
            };
        });

        res.status(200).json({ success: true, competitions: result });
    } catch (error) {
        console.error("getMyCompetitions error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (avatar) updateData.avatar = avatar;

        const user = await User.findByIdAndUpdate(req.user._id, updateData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error("updateProfile error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc    Change password (non-OAuth users only)
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select("+password");

        if (user.oauthProvider) {
            return res.status(400).json({
                success: false,
                message: "OAuth users cannot change password",
            });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error("changePassword error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── Admin Only ───────────────────────────────────────────────────────────────

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        let query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const users = await User.find(query).select("-password").sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("getAllUsers error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc    Update user role (add/remove support members)
// @route   PUT /api/users/:id/role
// @access  Admin
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "admin", "support"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("updateUserRole error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User deleted" });
    } catch (error) {
        console.error("deleteUser error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
