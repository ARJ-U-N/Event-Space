const express = require('express');
const { body } = require('express-validator');
const {
  getAdminDashboard,
  getPendingRequests,
  respondToBookingRequest,
  createHall,
  getMyHalls,
  updateHall,
  getAllMyHallRequests
} = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Admin dashboard
router.get('/dashboard', auth, authorize('admin'), getAdminDashboard);

// Pending requests for admin's halls only
router.get('/pending-requests', auth, authorize('admin'), getPendingRequests);

// All requests for admin's halls (with pagination and filters)
router.get('/my-hall-requests', auth, authorize('admin'), getAllMyHallRequests);

// Respond to booking request validation
const respondValidation = [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject'),
  body('rejectionReason')
    .if(body('action').equals('reject'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting a request')
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters'),
  body('adminNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Admin notes cannot exceed 500 characters')
];

router.put('/booking-request/:bookingId/respond', 
  auth, 
  authorize('admin'), 
  respondValidation,
  handleValidationErrors,
  respondToBookingRequest
);

// Hall management validation
const hallValidation = [
  body('name')
    .notEmpty()
    .withMessage('Hall name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Hall name must be between 2 and 100 characters'),
  body('number')
    .notEmpty()
    .withMessage('Hall number is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('Hall number must be between 1 and 20 characters'),
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Location must be between 5 and 200 characters'),
  body('capacity')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Capacity must be between 1 and 10000'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('amenities.projector')
    .optional()
    .isBoolean()
    .withMessage('Projector amenity must be true or false'),
  body('amenities.microphone')
    .optional()
    .isBoolean()
    .withMessage('Microphone amenity must be true or false'),
  body('amenities.speakers')
    .optional()
    .isBoolean()
    .withMessage('Speakers amenity must be true or false'),
  body('amenities.wifi')
    .optional()
    .isBoolean()
    .withMessage('WiFi amenity must be true or false'),
  body('amenities.whiteboard')
    .optional()
    .isBoolean()
    .withMessage('Whiteboard amenity must be true or false'),
  body('amenities.ac')
    .optional()
    .isBoolean()
    .withMessage('AC amenity must be true or false'),
  body('pricePerHour')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price per hour must be 0 or greater'),
  body('operatingHours.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('operatingHours.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
];

// Hall management routes (admin can only manage their own halls)
router.post('/halls', auth, authorize('admin'), hallValidation, handleValidationErrors, createHall);
router.get('/my-halls', auth, authorize('admin'), getMyHalls);
router.put('/halls/:hallId', auth, authorize('admin'), hallValidation, handleValidationErrors, updateHall);

module.exports = router;
