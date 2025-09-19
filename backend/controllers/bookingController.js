const Booking = require('../models/Booking');
const Hall = require('../models/Hall');
const moment = require('moment');

const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error('Invalid time format: ' + timeStr);
  }
  const parts = timeStr.split(':');
  if (parts.length !== 2) {
    throw new Error('Time must be in HH:MM format');
  }
  const [hours, minutes] = parts.map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error('Invalid time values');
  }
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const checkTimeSlotAvailability = async (hallId, eventDate, newStartTime, newEndTime, excludeBookingId = null) => {
  try {
    if (!newStartTime || !newEndTime) {
      throw new Error('Start time and end time are required');
    }

    const newStartMinutes = timeToMinutes(newStartTime);
    const newEndMinutes = timeToMinutes(newEndTime);
    
    const bufferMinutes = 60;
    const effectiveStartMinutes = newStartMinutes - bufferMinutes;
    const effectiveEndMinutes = newEndMinutes + bufferMinutes;

    const filter = {
      hall: hallId,
      eventDate: {
        $gte: moment(eventDate).startOf('day').toDate(),
        $lte: moment(eventDate).endOf('day').toDate()
      },
      status: { $in: ['PENDING', 'APPROVED'] }
    };

    if (excludeBookingId) {
      filter._id = { $ne: excludeBookingId };
    }

    const existingBookings = await Booking.find(filter);

    for (const booking of existingBookings) {
      if (!booking.startTime || !booking.endTime) {
        continue;
      }

      try {
        const existingStartMinutes = timeToMinutes(booking.startTime);
        const existingEndMinutes = timeToMinutes(booking.endTime);

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
      } catch (timeParseError) {
        console.error('Error parsing booking time:', timeParseError);
        continue;
      }
    }

    return { available: true };
  } catch (error) {
    throw new Error('Error checking slot availability: ' + error.message);
  }
};

const generateAvailableTimeSlots = async (hallId, eventDate) => {
  const operatingStart = 7 * 60;
  const operatingEnd = 18 * 60;
  const slotDuration = 60;
  const bufferMinutes = 60;

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

    let isAvailable = true;
    
    for (const booking of existingBookings) {
      if (!booking.startTime || !booking.endTime) continue;
      
      try {
        const bookingStart = timeToMinutes(booking.startTime);
        const bookingEnd = timeToMinutes(booking.endTime);
        
        if (
          (slotStart < bookingEnd + bufferMinutes && slotEnd + bufferMinutes > bookingStart) ||
          (slotStart - bufferMinutes < bookingEnd && slotEnd > bookingStart - bufferMinutes)
        ) {
          isAvailable = false;
          break;
        }
      } catch (error) {
        continue;
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

// UPDATED: Get user's bookings (changed user to requestedBy)
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ requestedBy: req.user.id }) // ✅ CHANGED: user → requestedBy
      .populate('hall', 'name number location capacity')
      .populate('requestedBy', 'name email') // ✅ CHANGED: user → requestedBy
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

// UPDATED: Get single booking (changed user to requestedBy)
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hall', 'name number location capacity')
      .populate('requestedBy', 'name email'); // ✅ CHANGED: user → requestedBy

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // ✅ CHANGED: booking.user._id → booking.requestedBy._id
    if (booking.requestedBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
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

// UPDATED: Create booking (changed user to requestedBy)
const createBooking = async (req, res) => {
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
      extraRequirements,
      notes 
    } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time and end time are required'
      });
    }

    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    if (numberOfSeats > hall.capacity) {
      return res.status(400).json({
        success: false,
        message: `Number of seats (${numberOfSeats}) exceeds hall capacity (${hall.capacity})`
      });
    }

    const bookingDate = moment(eventDate);
    if (bookingDate.isBefore(moment(), 'day')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates'
      });
    }

    const availability = await checkTimeSlotAvailability(hallId, eventDate, startTime, endTime);

    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: availability.reason,
        conflictingBooking: availability.conflictingBooking
      });
    }

    // ✅ CHANGED: user → requestedBy
    const booking = await Booking.create({
      requestedBy: req.user.id, // ✅ CRITICAL CHANGE: user → requestedBy
      hall: hallId,
      programmeName,
      eventDate,
      startTime,
      endTime,
      numberOfSeats,
      guestsAttending,
      equipmentRequirements: equipmentRequirements || { ac: false, projector: false },
      extraRequirements,
      notes,
      duration: 'custom'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('hall', 'name number location capacity')
      .populate('requestedBy', 'name email'); // ✅ CHANGED: user → requestedBy

    res.status(201).json({
      success: true,
      data: populatedBooking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking'
    });
  }
};

// UPDATED: Update booking (changed user to requestedBy)
const updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // ✅ CHANGED: booking.user → booking.requestedBy
    if (booking.requestedBy.toString() !== req.user.id) {
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

    if (req.body.startTime || req.body.endTime) {
      const newStartTime = req.body.startTime || booking.startTime;
      const newEndTime = req.body.endTime || booking.endTime;
      
      const availability = await checkTimeSlotAvailability(
        booking.hall, 
        booking.eventDate, 
        newStartTime, 
        newEndTime,
        booking._id
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
      .populate('requestedBy', 'name email'); // ✅ CHANGED: user → requestedBy

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

// UPDATED: Cancel booking (changed user to requestedBy)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // ✅ CHANGED: booking.user → booking.requestedBy
    if (booking.requestedBy.toString() !== req.user.id) {
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

// UPDATED: Get detailed hall availability (changed user to requestedBy in population)
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

    const bookings = await Booking.find({
      hall: hallId,
      eventDate: {
        $gte: moment(date).startOf('day').toDate(),
        $lte: moment(date).endOf('day').toDate()
      },
      status: { $in: ['PENDING', 'APPROVED'] }
    }).populate('requestedBy', 'name').sort({ startTime: 1 }); // ✅ CHANGED: user → requestedBy

    const validBookings = bookings.filter(booking => booking.startTime && booking.endTime);
    const availableSlots = await generateAvailableTimeSlots(hallId, date);

    res.json({
      success: true,
      data: {
        date,
        hallId,
        hallName: hall.name,
        totalBookings: validBookings.length,
        operatingHours: {
          start: '07:00',
          end: '18:00'
        },
        bookings: validBookings.map(booking => ({
          id: booking._id,
          programmeName: booking.programmeName,
          startTime: booking.startTime,
          endTime: booking.endTime,
          numberOfSeats: booking.numberOfSeats,
          status: booking.status,
          user: booking.requestedBy.name // ✅ CHANGED: booking.user → booking.requestedBy
        })),
        availableSlots,
        bufferTime: '1 hour'
      }
    });
  } catch (error) {
    console.error('Availability check error:', error);
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
