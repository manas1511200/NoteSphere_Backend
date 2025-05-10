const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');

exports.register = async (req, res) => {
  try {
    const { username, email, password, role, college } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, role, college });
    await newUser.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ success: false, message: 'User registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, username: user.username, email, role: user.role, college: user.college }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.profilePhotoPath && fs.existsSync(user.profilePhotoPath)) {
      fs.unlinkSync(user.profilePhotoPath); // Remove old photo
    }
    user.profilePhotoPath = req.file.path;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      profilePhotoPath: `/uploads/profiles/${req.file.filename}`
    });
  } catch (err) {
    console.error('Upload Profile Photo Error:', err);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Failed to upload profile photo', error: err.message });
  }
};