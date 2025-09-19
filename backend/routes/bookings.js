const express = require('express');
const { body } = require('express-validator');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  cancelBooking,
  getHallAvailability
} = require('../controllers/bookingController');
const { auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

const bookingValidation = [
  body('hallId')
    .notEmpty()
    .withMessage('Hall ID is required')
    .isMongoId()
    .withMessage('Invalid hall ID'),
  body('programmeName')
    .notEmpty()
    .withMessage('Programme name is required')
    .isLength({ max: 200 })
    .withMessage('Programme name cannot exceed 200 characters'),
  body('eventDate')
    .isISO8601()
    .withMessage('Please provide a valid date'),
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
    .isInt({ min: 1 })
    .withMessage('Number of seats must be at least 1'),
  body('extraRequirements')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Extra requirements cannot exceed 500 characters'),
  body('endTime').custom((endTime, { req }) => {
    const startTime = req.body.startTime;
    if (startTime && endTime) {
      try {
        const timeToMinutes = (timeStr) => {
          if (!timeStr || typeof timeStr !== 'string') return 0;
          const parts = timeStr.split(':');
          if (parts.length !== 2) return 0;
          const [hours, minutes] = parts.map(Number);
          if (isNaN(hours) || isNaN(minutes)) return 0;
          return hours * 60 + minutes;
        };
        
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        
        if (startMinutes === 0 || endMinutes === 0) {
          throw new Error('Invalid time format');
        }
        
        if (endMinutes <= startMinutes) {
          throw new Error('End time must be after start time');
        }
        
        if ((endMinutes - startMinutes) < 60) {
          throw new Error('Minimum booking duration is 1 hour');
        }
        
        if (startMinutes < 420 || endMinutes > 1080) {
          throw new Error('Booking time must be between 7:00 AM and 6:00 PM');
        }
      } catch (error) {
        throw new Error(error.message);
      }
    }
    return true;
  })
];

router.route('/')
  .get(auth, getBookings)
  .post(auth, bookingValidation, handleValidationErrors, createBooking);

router.route('/:id')
  .get(auth, getBooking)
  .put(auth, updateBooking)
  .delete(auth, cancelBooking);

router.get('/availability/:hallId/:date', auth, getHallAvailability);

router.get('/events/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const Booking = require('../models/Booking');
    
    const bookings = await Booking.find({
      eventDate: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lte: new Date(date + 'T23:59:59.999Z')
      },
      status: { $in: ['PENDING', 'APPROVED'] }
    }).populate('hall', 'name');

    const events = bookings.map(booking => ({
      title: booking.programmeName,
      time: `${booking.startTime} - ${booking.endTime}`,
      hall: booking.hall.name
    }));

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
