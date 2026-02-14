const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");


dotenv.config();
connectDB();

const app = express();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});