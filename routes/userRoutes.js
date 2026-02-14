const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
    getMyCompetitions,
    updateProfile,
    changePassword,
    getAllUsers,
    updateUserRole,
    deleteUser,
} = require("../controllers/userController");

// ─── Protected (any logged-in user) ──────────────────────────────────────────
router.get("/my-competitions", protect, getMyCompetitions);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// ─── Admin Only ──────────────────────────────────────────────────────────────
router.get("/", protect, authorize("admin"), getAllUsers);
router.put("/:id/role", protect, authorize("admin"), updateUserRole);
router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;
