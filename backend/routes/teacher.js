const express = require('express');
const { body } = require('express-validator');
const {
  getAvailableHalls,
  submitBookingRequest,
  getMyBookingRequests,
  getBookingRequest
} = require('../controllers/teacherController');
const { auth, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Booking request validation
const bookingRequestValidation = [
  body('hallId')
    .notEmpty()
    .withMessage('Hall ID is required')
    .isMongoId()
    .withMessage('Invalid hall ID'),
  body('programmeName')
    .notEmpty()
    .withMessage('Programme name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Programme name must be between 2 and 200 characters'),
  body('eventDate')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Event date cannot be in the past');
      }
      return true;
    }),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('numberOfSeats')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Number of seats must be between 1 and 1000'),
  body('guestsAttending')
    .optional()
    .isBoolean()
    .withMessage('Guests attending must be true or false'),
  body('equipmentRequirements.ac')
    .optional()
    .isBoolean()
    .withMessage('AC requirement must be true or false'),
  body('equipmentRequirements.projector')
    .optional()
    .isBoolean()
    .withMessage('Projector requirement must be true or false'),
  body('extraRequirements')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Extra requirements cannot exceed 500 characters')
];

// Routes for teachers only
router.get('/halls', auth, authorize('teacher'), getAvailableHalls);
router.post('/booking-request', auth, authorize('teacher'), bookingRequestValidation, handleValidationErrors, submitBookingRequest);
router.get('/my-requests', auth, authorize('teacher'), getMyBookingRequests);
router.get('/my-requests/:id', auth, authorize('teacher'), getBookingRequest);

module.exports = router;
