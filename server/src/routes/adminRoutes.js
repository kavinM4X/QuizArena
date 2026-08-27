const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
const { register, login, getProfile } = require('../controllers/adminController');

// POST /api/admin/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
  ],
  register
);

// POST /api/admin/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

// GET /api/admin/profile  (protected)
router.get('/profile', protect, getProfile);

module.exports = router;
