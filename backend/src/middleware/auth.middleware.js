const userModel = require("../model/auth.model");
const jwt = require("jsonwebtoken");

async function authUser(req, res, next) {
  const { token } = req.cookies || {}; // use req.cookies, not req.cookie

  if (!token) {
    return res.status(401).json({ message: "Unauthorized Access!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

module.exports = {
  authUser,
};
