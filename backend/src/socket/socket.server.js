const {Server} = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const generateContent = require("../service/ai.service");
const userModel = require("../model/auth.model");
const messageModel = require("../model/message.model");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

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
      await messageModel.create({
        user: socket.user._id,
        chat: msg.chat,
        content: msg.content,
        role: "user",
      });

      console.log("Full msg object:", msg);

      const res = await generateContent(msg.content);

      await messageModel.create({
        content: res,
        role: "model",
      });

      socket.emit("ai-response", {
        content: res,
        chatID: msg.chat,
      });
      console.log(res);
    });
  });
}

module.exports = initSocketServer;
