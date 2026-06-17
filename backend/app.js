const express = require('express');
const app = express();
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();

// Middleware setup
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json()); 
app.use(bodyParser.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 

app.use(express.static("public")); 


// Database connection
const URI = process.env.ATLASDB_URL;
const connect = async () => {
  try {
    const res = await mongoose.connect(URI);
    console.log("Database connected");
  } catch (error) {
    console.error("Error while connecting to the database", error);
  }
};
connect();

// Routes
const userRouter = require('./src/router/user.routes');
const postRouter = require('./src/router/post.routes');
const mediaRouter = require("./src/router/media.routes");
const notificationRouter = require("./src/router/notification.routes");
app.use("/user", userRouter);
app.use("/post", postRouter);
app.use("/media", mediaRouter);
app.use("/notifications", notificationRouter);

// Basic route
app.get("/", (req, res) => {
  res.send("hi");
});

// Start server
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

module.exports = app;
