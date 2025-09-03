const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const chatControllers = require("../controllers/auth.controller");

const router = express.Router();

// Use a specific controller function instead of the whole object
router.post("/", authMiddleware.authUser, chatControllers.registerUser);

module.exports = router;
