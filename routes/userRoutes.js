const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { validate, verifyToken } = require('../middleware/auth');
const { check } = require('express-validator');
const profileUpload = require('../config/profileMulter');

router.post(
  '/register',
  [
    check('username').notEmpty().withMessage('Username is required'),
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    check('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
    check('college').notEmpty().withMessage('College name is required')
  ],
  validate,
  userController.register
);

router.post('/login', userController.login);

router.post(
  '/upload-profile-photo',
  verifyToken,
  profileUpload.single('profilePhoto'),
  userController.uploadProfilePhoto
);

module.exports = router;