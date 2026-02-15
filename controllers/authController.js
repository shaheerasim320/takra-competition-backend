const { validationResult, body } = require("express-validator");
const User = require("../models/User");
const {
    generateAccessToken,
    generateRefreshToken,
    setTokenCookies,
} = require("../utils/generateToken");
const jwt = require("jsonwebtoken");

// ─── Validation Rules ────────────────────────────────────────────────────────

const registerValidation = [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/)
        .withMessage("Password must contain at least one lowercase letter")
        .matches(/[0-9]/)
        .withMessage("Password must contain at least one number"),
];

const loginValidation = [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
];

// ─── Helper: format user response (strip sensitive fields) ───────────────────

const formatUserResponse = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    oauthProvider: user.oauthProvider,
    registeredCompetitions: user.registeredCompetitions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        // Create user (password is hashed by the pre-save hook in User model)
        const user = await User.create({ name, email, password });

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        setTokenCookies(res, accessToken, refreshToken);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            user: formatUserResponse(user),
            accessToken,
        });
    } catch (error) {
        console.error("Register error:", error.message);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: "Server error during registration",
            error: error.message, // expose error for debugging
        });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const { email, password } = req.body;

        // Find user and explicitly include password field
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // OAuth-only accounts don't have a password
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: `This account uses ${user.oauthProvider} login. Please sign in with ${user.oauthProvider}.`,
            });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        setTokenCookies(res, accessToken, refreshToken);

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: formatUserResponse(user),
            accessToken,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login",
        });
    }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate(
            "registeredCompetitions"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public (requires valid refresh token cookie)
 */
const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No refresh token provided",
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token — user not found",
            });
        }

        // Issue new access token
        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);
        setTokenCookies(res, newAccessToken, newRefreshToken);

        res.status(200).json({
            success: true,
            message: "Token refreshed",
            accessToken: newAccessToken,
        });
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token — please login again",
            });
        }
        console.error("RefreshToken error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

/**
 * @desc    Logout — clear token cookies
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/api/auth/refresh-token" });

    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

/**
 * @desc    Google OAuth callback — generate tokens and redirect to frontend
 * @route   GET /api/auth/google/callback
 * @access  Public (called by Google)
 */
const googleCallback = async (req, res) => {
    try {
        const user = req.user;

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        setTokenCookies(res, accessToken, refreshToken);

        // Redirect to frontend with success
        const clientURL = "https://takra-competition.vercel.app";
        res.redirect(`${clientURL}/auth/oauth-success?token=${accessToken}`);
    } catch (error) {
        console.error("Google callback error:", error);
        const clientURL = "https://takra-competition.vercel.app";
        res.redirect(`${clientURL}/auth/oauth-error`);
    }
};

module.exports = {
    register,
    login,
    getMe,
    refreshToken,
    logout,
    googleCallback,
    registerValidation,
    loginValidation,
};
