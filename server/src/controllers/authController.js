const { registerUser, loginUser } = require("../services/authService");

async function register(req, res) {
  try {
    const { phone, password, name } = req.body;
    const user = await registerUser(phone, password, name);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { phone, password } = req.body;
    const user = await loginUser(phone, password);
    res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = { register, login };
