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
        // Save user message + vectorize
        const [message, vector] = await Promise.all([
          messageModel.create({
            chat: msg.chat,
            user: socket.user._id,
            content: msg.content,
            role: "user",
          }),
          generateVectors(msg.content),
        ]);

        // Store user message in Pinecone
        await createMemory({
          vectors: vector,
          messageID: message._id.toString(),
          metadata: {
            chat: msg.chat,
            user: socket.user._id.toString(),
            content: msg.content,
          },
        });

        // Query Pinecone + fetch history
        const [memory, chatHistory] = await Promise.all([
          queryMemory({
            queryVector: vector,
            limit: 3,
            metadata: { user: socket.user._id.toString() },
          }),
          messageModel
            .find({ chat: msg.chat })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
            .then((messages) => messages.reverse()),
        ]);

        // Format context
        const stm = chatHistory.map((item) => ({
          role: item.role,
          parts: [{ text: item.content }],
        }));

        const ltm = [
          {
            role: "user",
            parts: [
              {
                text: `
These are some previous messages from the chat, use them to generate a response:

${memory.map((item) => item.metadata.content).join("\n")}
                `,
              },
            ],
          },
        ];

        // Generate AI response
        const response = await generateContent([...ltm, ...stm]);

        // Send to client
        socket.emit("ai-response", {
          chatId: msg.chat,
          content: response,
        });

        // Save AI response + vectorize
        const [responseMessage, responseVector] = await Promise.all([
          messageModel.create({
            chat: msg.chat,
            user: socket.user._id,
            content: response,
            role: "model",
          }),
          generateVectors(response),
        ]);

        // Store AI response in Pinecone
        await createMemory({
          vectors: responseVector,
          messageID: responseMessage._id.toString(),
          metadata: {
            chat: msg.chat,
            user: socket.user._id.toString(),
            content: response,
          },
        });
      } catch (err) {
        console.error("Error handling ai-message:", err);
      }
    });
  });
}

module.exports = initSocketServer;
