const userModel = require("../model/auth.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

async function registerUser(req, res) {
  const {
    fullName: {firstName, lastName},
    email,
    password,
  } = req.body;

  const isUserExist = await userModel.findOne({email});

  if (isUserExist) {
    return res.status(400).json({message: "User Already Exists!!"});
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    fullName: {firstName, lastName},
    email,
    password: hashedPassword,
  });

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({message: "JWT secret is not defined"});
  }

  const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);

  res.cookie("token", token);
  res.status(201).json({message: "User registered successfully"});
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid Email or Password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid Email or Password" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret is not defined" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.cookie("token", token);

  res.status(200).json({
    message: "Login successful",
    user: {
      email: user.email,
      fullName: user.fullName,
      _id: user._id,
    },
  });
}


module.exports = {
  registerUser,
  loginUser,
};
