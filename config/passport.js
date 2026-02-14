const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// ─── JWT Strategy ────────────────────────────────────────────────────────────
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Try Authorization header first
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. Fall back to cookie
        (req) => {
            if (req && req.cookies) {
                return req.cookies.accessToken;
            }
            return null;
        },
    ]),
    secretOrKey: process.env.JWT_SECRET,
};

passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            const user = await User.findById(payload.id);
            if (!user) return done(null, false);
            return done(null, user);
        } catch (err) {
            return done(err, false);
        }
    })
);

// ─── Google OAuth 2.0 Strategy ───────────────────────────────────────────────
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/auth/google/callback",
            scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists with this Google ID
                let user = await User.findOne({
                    oauthProvider: "google",
                    oauthId: profile.id,
                });

                if (user) {
                    return done(null, user);
                }

                // Check if a user with the same email already exists (link accounts)
                user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // Link Google account to existing user
                    user.oauthProvider = "google";
                    user.oauthId = profile.id;
                    user.avatar = user.avatar || profile.photos[0]?.value;
                    await user.save();
                    return done(null, user);
                }

                // Create a brand-new user
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    oauthProvider: "google",
                    oauthId: profile.id,
                    avatar: profile.photos[0]?.value,
                });

                return done(null, user);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

module.exports = passport;
