const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect routes — verify JWT from cookie or Authorization header
 */
const protect = async (req, res, next) => {
    try {
        let token = null;

        // 1. Try Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        // 2. Fall back to cookie
        if (!token && req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized — no token provided",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized — user not found",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired — please refresh",
                code: "TOKEN_EXPIRED",
            });
        }
        return res.status(401).json({
            success: false,
            message: "Not authorized — invalid token",
        });
    }
};

/**
 * Authorize by role(s) — must be used AFTER protect middleware
 * Usage: authorize("admin") or authorize("admin", "support")
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this resource`,
            });
        }

        next();
    };
};

module.exports = { protect, authorize };
