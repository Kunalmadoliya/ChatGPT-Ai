const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { generateContent, generateVectors } = require("../service/ai.service");
const userModel = require("../model/auth.model");
const messageModel = require("../model/message.model");
const { queryMemory, createMemory } = require("../service/vector.service");
const { v4: uuidv4 } = require("uuid");

async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  // middleware for auth
  io.use(async (socket, next) => {
    try {
      const parsedCookie = cookie.parse(socket.handshake.headers.cookie || "");
      const token = parsedCookie.token;

      if (!token) return next(new Error("Authentication error: No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      if (!user) return next(new Error("Authentication error: User not found"));

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("ai-message", async (msg) => {
      try {
        // save user msg
        await messageModel.create({
          chat: msg.chat,
          user: socket.user._id,
          content: msg.content,
          role: "user",
        });

        // vectorize
        const vector = await generateVectors(msg.content);

        // query memory
        const memory = await queryMemory({ queryVector: vector, limit: 3 });

        // get last 20 messages
        const chatHistory = (
          await messageModel
            .find({ chat: msg.chat })
            .sort({ createdAt: -1 })
            .limit(20)
        ).reverse();

        // build context
        const stm = chatHistory.map((item) => ({
          role: item.role,
          parts: [{ text: item.content }],
        }));

        // generate response
        const response = await generateContent(stm);

        // save AI response
        await messageModel.create({
          chat: msg.chat,
          content: response,
          role: "model",
        });

        // send to client
        socket.emit("ai-response", {
          chatId: msg.chat,
          content: response,
        });

        // store in memory
        await createMemory({
          vectors: vector,
          messageID: uuidv4(),
          metadata: {
            chat: msg.chat,
            user: socket.user._id.toString(),
            text: msg.content,
          },
        });
      } catch (err) {
        console.error("Error handling ai-message:", err);
      }
    });
  });
}

module.exports = initSocketServer;

