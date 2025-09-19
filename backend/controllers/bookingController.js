const Booking = require('../models/Booking');
const Hall = require('../models/Hall');
const moment = require('moment');

// Helper function to convert time string to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes to time string
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// NEW: Check time slot availability with buffer
const checkTimeSlotAvailability = async (hallId, eventDate, newStartTime, newEndTime, excludeBookingId = null) => {
  try {
    const newStartMinutes = timeToMinutes(newStartTime);
    const newEndMinutes = timeToMinutes(newEndTime);
    
    // Add 1-hour buffer (60 minutes)
    const bufferMinutes = 60;
    const effectiveStartMinutes = newStartMinutes - bufferMinutes;
    const effectiveEndMinutes = newEndMinutes + bufferMinutes;

    // Find existing bookings for the same day
    const filter = {
      hall: hallId,
      eventDate: {
        $gte: moment(eventDate).startOf('day').toDate(),
        $lte: moment(eventDate).endOf('day').toDate()
      },
      status: { $in: ['PENDING', 'APPROVED'] }
    };

    // Exclude current booking when updating
    if (excludeBookingId) {
      filter._id = { $ne: excludeBookingId };
    }

    const existingBookings = await Booking.find(filter);

    // Check for conflicts including buffer time
    for (const booking of existingBookings) {
      const existingStartMinutes = timeToMinutes(booking.startTime);
      const existingEndMinutes = timeToMinutes(booking.endTime);

      // Check if the new booking (including buffer) overlaps with existing booking
      const hasOverlap = (
        (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) ||
        (effectiveStartMinutes < existingEndMinutes && effectiveEndMinutes > existingStartMinutes)
      );

      if (hasOverlap) {
        return {
          available: false,
          conflictingBooking: booking,
          reason: `Time slot conflicts with existing booking: ${booking.startTime} - ${booking.endTime}. Remember to leave 1-hour buffer time.`
        };
      }
    }

    return { available: true };
  } catch (error) {
    throw new Error('Error checking slot availability: ' + error.message);
  }
};

// NEW: Generate available time slots for a given day
const generateAvailableTimeSlots = async (hallId, eventDate) => {
  const operatingStart = 7 * 60; // 7 AM
  const operatingEnd = 18 * 60; // 6 PM
  const slotDuration = 60; // 1 hour slots
  const bufferMinutes = 60;

  // Get existing bookings
  const existingBookings = await Booking.find({
    hall: hallId,
    eventDate: {
      $gte: moment(eventDate).startOf('day').toDate(),
      $lte: moment(eventDate).endOf('day').toDate()
    },
    status: { $in: ['PENDING', 'APPROVED'] }
  }).sort({ startTime: 1 });

  const availableSlots = [];
  let currentTime = operatingStart;

  while (currentTime < operatingEnd) {
    const slotStart = currentTime;
    const slotEnd = currentTime + slotDuration;

    // Check if this slot conflicts with any booking (including buffer)
    let isAvailable = true;
    
    for (const booking of existingBookings) {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      
      // Check overlap including buffer
      if (
        (slotStart < bookingEnd + bufferMinutes && slotEnd + bufferMinutes > bookingStart) ||
        (slotStart - bufferMinutes < bookingEnd && slotEnd > bookingStart - bufferMinutes)
      ) {
        isAvailable = false;
        break;
      }
    }

    if (isAvailable && slotEnd <= operatingEnd) {
      availableSlots.push({
        startTime: minutesToTime(slotStart),
        endTime: minutesToTime(slotEnd),
        duration: '1-hour'
      });
    }

    currentTime += slotDuration;
  }

  return availableSlots;
};

// Updated create booking function
const createBooking = async (req, res) => {
  try {
    const { hallId, programmeName, eventDate, startTime, endTime, numberOfSeats, guestsAttending, notes } = req.body;

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

    // Validate booking date
    const bookingDate = moment(eventDate);
    if (bookingDate.isBefore(moment(), 'day')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates'
      });
    }

    // Check time slot availability with buffer
    const availability = await checkTimeSlotAvailability(hallId, eventDate, startTime, endTime);

    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: availability.reason,
        conflictingBooking: availability.conflictingBooking
      });
    }

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      hall: hallId,
      programmeName,
      eventDate,
      startTime,
      endTime,
      numberOfSeats,
      guestsAttending,
      notes,
      duration: 'custom' // Set as custom for new dynamic bookings
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('hall', 'name number location capacity')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: populatedBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Updated get detailed hall availability
const getDetailedHallAvailability = async (req, res) => {
  try {
    const { hallId, date } = req.params;

    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    // Get existing bookings
    const bookings = await Booking.find({
      hall: hallId,
      eventDate: {
        $gte: moment(date).startOf('day').toDate(),
        $lte: moment(date).endOf('day').toDate()
      },
      status: { $in: ['PENDING', 'APPROVED'] }
    }).populate('user', 'name').sort({ startTime: 1 });

    // Generate available time slots
    const availableSlots = await generateAvailableTimeSlots(hallId, date);

    res.json({
      success: true,
      data: {
        date,
        hallId,
        hallName: hall.name,
        totalBookings: bookings.length,
        operatingHours: {
          start: '07:00',
          end: '18:00'
        },
        bookings: bookings.map(booking => ({
          id: booking._id,
          programmeName: booking.programmeName,
          startTime: booking.startTime,
          endTime: booking.endTime,
          numberOfSeats: booking.numberOfSeats,
          status: booking.status,
          user: booking.user.name
        })),
        availableSlots,
        bufferTime: '1 hour'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Rest of the controller functions remain the same but update references to use startTime/endTime
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('hall', 'name number location capacity')
      .populate('user', 'name email')
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

const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hall', 'name number location capacity')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
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

const updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update booking that is not pending'
      });
    }

    // If updating time, check availability
    if (req.body.startTime || req.body.endTime) {
      const newStartTime = req.body.startTime || booking.startTime;
      const newEndTime = req.body.endTime || booking.endTime;
      
      const availability = await checkTimeSlotAvailability(
        booking.hall, 
        booking.eventDate, 
        newStartTime, 
        newEndTime,
        booking._id // Exclude current booking
      );

      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: availability.reason
        });
      }
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('hall', 'name number location capacity')
      .populate('user', 'name email');

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

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  cancelBooking,
  getHallAvailability: getDetailedHallAvailability
};
