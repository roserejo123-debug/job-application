require("node:dns").setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

const applicationRoutes = require("./routes/applicationRoutes");

app.use(cors());
app.use(express.json());

app.use("/api/applications", applicationRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Job Application Tracker API is running",
    data: null
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });