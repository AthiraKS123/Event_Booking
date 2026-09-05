/**
 * Auth Controller Handlers
 * 
 * Concepts Demonstrated:
 * 1. Dual Token Pattern (Access Token + Refresh Token):
 *    - Short-lived Access Token (15m): Reduces window of opportunity if stolen.
 *    - Long-lived Refresh Token (7d): Stored in database, enables token revocation & seamless session updates.
 * 2. Async Controller Flow: Catching errors and passing them to `next(err)` for centralized handling.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Helper to generate short-lived JWT Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

// Helper to generate long-lived JWT Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      res.status(400);
      return next(new Error('Please provide name, email, and password'));
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      return next(new Error('User with this email already exists'));
    }

    // 3. Create user (password hashing triggers automatically in pre-save hook)
    const user = new User({
      name,
      email,
      password,
      role: role && ['user', 'admin'].includes(role) ? role : 'user',
    });

    // 4. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user document
    user.refreshToken = refreshToken;
    await user.save();

    // 5. Send response (exclude password and sensitive fields)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      res.status(400);
      return next(new Error('Please provide email and password'));
    }

    // 2. Find user & explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // 3. Compare password using instance method
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // 4. Generate new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh Access Token using valid Refresh Token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400);
      return next(new Error('Refresh token is required'));
    }

    // 1. Verify Refresh Token signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      res.status(401);
      return next(new Error('Invalid or expired refresh token'));
    }

    // 2. Find user by ID and check if refresh token matches database copy
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      res.status(401);
      return next(new Error('Invalid refresh token session'));
    }

    // 3. Issue new Access Token
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
};
