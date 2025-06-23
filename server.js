require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use("/api", require("./routes/peptides"));
app.use("/api/admin", require("./routes/admin"));

// Error handling
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res
    .status(500)
    .json({ message: "Something went wrong", error: error.message });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
mongoose.connection.once("open", async () => {
  console.log("✅ Connected to MongoDB");

  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const hashedPassword = await bcrypt.hash("admin123!", 10);
    await Admin.create({
      email: "admin@peptideprice.com",
      password: hashedPassword,
    });
    console.log("✅ Default admin created: admin@peptideprice.com / admin123!");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
