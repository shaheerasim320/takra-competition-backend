require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const categoryRoutes = require("./routes/categoryRoutes");
const competitionRoutes = require("./routes/competitionRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const passport = require("./config/passport");

// Load env vars

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:3000", process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging Middleware ───────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/competitions", competitionRoutes);

// ─── Passport ─────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Taakra API is running" });
});


app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});