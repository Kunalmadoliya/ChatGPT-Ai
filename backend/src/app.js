const express = require("express");
var cookieParser = require('cookie-parser')
const connectToDB = require("./db/db");
const cors = require('cors')


// router
const authRoutes = require("./routes/auth.route")
const chatRoutes = require("./routes/chat.routes")


const app = express();
connectToDB();


// middleware
app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}))


// routes
app.use("/api/auth" , authRoutes)
app.use("/api/chat" , chatRoutes )

module.exports = app;
