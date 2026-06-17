const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Adjust the path to your User model

const authenticate = async (req, res, next) => {
  const token = req.cookies.token || req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized1' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const user = await User.findById(decoded.userId); // Find the user by ID

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized2' });
    }

    // Only attach the username to the request object
    req.user = { username: user.username, id: user._id, role: user.role };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
