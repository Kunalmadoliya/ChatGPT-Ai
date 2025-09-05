const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const generateContent = require("../service/ai.service");
const userModel = require("../model/auth.model");
const messageModel = require("../model/message.model");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  // Middleware for authentication
  io.use(async (socket, next) => {
    const parsedCookies = cookie.parse(socket.handshake.headers.cookie || "");

    if (!parsedCookies.token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(parsedCookies.token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      socket.user = user;

      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("ai-message", async (msg) => {
      try {
        // ✅ Save user message
        await messageModel.create({
          user: socket.user._id,
          chat: msg.chat,
          content: msg.content,
          role: "user",
        });

        // ✅ Fetch chat history (last 20 messages)
        const chatHistory = (
          await messageModel
            .find({ chat: msg.chat })
            .sort({ createdAt: -1 })
            .limit(20)
        ).reverse();

        // ✅ Generate AI response
        const res = await generateContent(
          chatHistory.map((item) => ({
            role: item.role,
            parts: [{ text: item.content }],
          }))
        );

        // ✅ Save AI response in the same chat
        await messageModel.create({
          chat: msg.chat,
          content: res,
          role: "model",
        });

        // ✅ Send response back to the client
        socket.emit("ai-response", {
          chatID: msg.chat,
          content: res,
        });

        console.log("Chat history updated:", chatHistory);
      } catch (error) {
        console.error("Error handling ai-message:", error);
      }
    });
  });
}

module.exports = initSocketServer;
