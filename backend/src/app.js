const express = require("express");
var cookieParser = require('cookie-parser')
const connectToDB = require("./db/db");


// router
const authRoutes = require("./routes/auth.route")
const chatRoutes = require("./routes/chat.routes")


const app = express();
connectToDB();


// middleware
app.use(express.json());
app.use(cookieParser())


// routes
app.use("/api/auth" , authRoutes)
app.use("/api/" , chatRoutes )

module.exports = app;
