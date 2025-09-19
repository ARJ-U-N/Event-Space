const express = require('express');
const { body } = require('express-validator');
const {
  getAllAdmins,
  createHallAdmin,
  updateHallAdmin,
  deactivateAdmin,
  reactivateAdmin
} = require('../controllers/superAdminController');
const { auth, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// More flexible admin creation validation
const createAdminValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters'),
  body('password')
    .isLength({ min: 6, max: 100 }) // More flexible password requirements
    .withMessage('Password must be at least 6 characters long'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters')
    .trim(),
  body('phone')
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters')
    .trim()
];

// Admin update validation (no password)
const updateAdminValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters')
    .trim(),
  body('phone')
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters')
    .trim()
];

// Super admin routes (ONLY for managing hall admins)
router.get('/admins', auth, authorize('superadmin'), getAllAdmins);
router.post('/admins', auth, authorize('superadmin'), createAdminValidation, handleValidationErrors, createHallAdmin);
router.put('/admins/:adminId', auth, authorize('superadmin'), updateAdminValidation, handleValidationErrors, updateHallAdmin);
router.put('/admins/:adminId/deactivate', auth, authorize('superadmin'), deactivateAdmin);
router.put('/admins/:adminId/reactivate', auth, authorize('superadmin'), reactivateAdmin);

module.exports = router;
