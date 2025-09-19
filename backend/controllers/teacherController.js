const Hall = require('../models/Hall');
const Booking = require('../models/Booking');
const moment = require('moment');

// Get all available halls (created by any admin)
const getAvailableHalls = async (req, res) => {
  try {
    const halls = await Hall.find({ isActive: true })
      .populate('createdBy', 'name email department')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: halls.length,
      data: halls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Submit booking request
const submitBookingRequest = async (req, res) => {
  try {
    const {
      hallId,
      programmeName,
      eventDate,
      startTime,
      endTime,
      numberOfSeats,
      guestsAttending,
      equipmentRequirements,
      extraRequirements
    } = req.body;

    // Validate hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    // Validate seat capacity
    if (numberOfSeats > hall.capacity) {
      return res.status(400).json({
        success: false,
        message: `Number of seats (${numberOfSeats}) exceeds hall capacity (${hall.capacity})`
      });
    }

    // Validate booking date (cannot book for past dates)
    const bookingDate = moment(eventDate);
    if (bookingDate.isBefore(moment(), 'day')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates'
      });
    }

    // Check for time conflicts with approved bookings
    const conflictingBooking = await Booking.findOne({
      hall: hallId,
      eventDate: {
        $gte: moment(eventDate).startOf('day').toDate(),
        $lte: moment(eventDate).endOf('day').toDate()
      },
      status: 'APPROVED',
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: `Time slot conflicts with an approved booking: ${conflictingBooking.startTime} - ${conflictingBooking.endTime}`
      });
    }

    // Create booking request (status: PENDING by default)
    const booking = await Booking.create({
      requestedBy: req.user.id,
      hall: hallId,
      programmeName,
      eventDate,
      startTime,
      endTime,
      numberOfSeats,
      guestsAttending: guestsAttending || false,
      equipmentRequirements: equipmentRequirements || { ac: false, projector: false },
      extraRequirements
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('hall', 'name number location capacity')
      .populate('requestedBy', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully. Awaiting admin approval.',
      data: populatedBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get teacher's booking requests
const getMyBookingRequests = async (req, res) => {
  try {
    const bookings = await Booking.find({ requestedBy: req.user.id })
      .populate('hall', 'name number location capacity')
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single booking request details
const getBookingRequest = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hall', 'name number location capacity amenities')
      .populate('requestedBy', 'name email department')
      .populate('respondedBy', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found'
      });
    }

    // Check authorization (only the requester can view their own booking)
    if (booking.requestedBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking request'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAvailableHalls,
  submitBookingRequest,
  getMyBookingRequests,
  getBookingRequest
};
