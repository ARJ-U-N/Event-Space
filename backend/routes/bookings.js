
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

// Booking validation
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
  body('duration')
    .isIn(['half-day-morning', 'half-day-afternoon', 'full-day', '2-hours', '4-hours'])
    .withMessage('Invalid duration'),
  body('numberOfSeats')
    .isInt({ min: 1 })
    .withMessage('Number of seats must be at least 1')
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
    const bookings = await Booking.find({
      eventDate: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lte: new Date(date + 'T23:59:59.999Z')
      },
      status: { $in: ['PENDING', 'APPROVED'] }
    }).populate('hall', 'name');

    const events = bookings.map(booking => ({
      title: booking.programmeName,
      time: `${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}`,
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
