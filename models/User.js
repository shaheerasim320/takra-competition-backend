// models/User.js

const mongoose = require("mongoose")

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

module.exports = mongoose.model("User", userSchema);