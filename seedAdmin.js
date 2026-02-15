require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

const seedAdmin = async () => {
    await connectDB();

    const existing = await User.findOne({ email: "admin@taakra.com" });
    if (existing) {
        console.log("✅ Admin user already exists:");
        console.log(`   Email: ${existing.email}`);
        console.log(`   Role:  ${existing.role}`);
        process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const admin = await User.create({
        name: "Admin",
        email: "admin@taakra.com",
        password: hashedPassword,
        role: "admin",
    });

    console.log("🚀 Admin user seeded successfully!");
    console.log(`   Email:    admin@taakra.com`);
    console.log(`   Password: admin123`);
    console.log(`   Role:     ${admin.role}`);
    process.exit(0);
};

seedAdmin().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
