const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Import Routes
const usersRoutes = require("./routes/api/users");
const authRoutes = require("./routes/api/authRoutes");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Use the correct prefixes for routes to avoid conflicts
app.use("/auth", authRoutes); // Authentication routes (signup, login, etc.)
app.use("/users", usersRoutes); // User-specific routes (profile, update, etc.)

// 404 Error handling for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

// Global Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
    // Start the server after DB connection
    app.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
