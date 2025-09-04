const chatModel = require("../model/chat.model");

async function createChat(req , res) {
  const {title} = req.body;
  const user = req.user;

  const chat = await chatModel.create({
    user: user._id,
    title,
  });

  res.status(201).json({
    message: "Chat Created Successfully",
    chat: {
    title: chat.title,
      user: chat.user,
      _id: chat._id,
      lastActivity: chat.lastactivity,
    },
  });
}

module.exports = {
  createChat,
};
