// models/User.js

const mongoose = require("mongoose")
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.oauthProvider;
      },
      select: false, // Don't return password by default in queries
    },

    // OAuth Support
    oauthProvider: {
      type: String, // "google", "github", etc.
    },
    oauthId: {
      type: String,
    },

    // Role-based access
    role: {
      type: String,
      enum: ["user", "admin", "support"],
      default: "user",
    },

    // Profile
    avatar: {
      type: String,
    },

    // Registered competitions
    registeredCompetitions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Competition",
      },
    ],

    // Chat / support
    isOnline: {
      type: Boolean,
      default: false,
    },

    // Admin-only
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);