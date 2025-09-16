
const Booking = require('../models/Booking');
const Hall = require('../models/Hall');
const moment = require('moment');


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


const getTimeSlots = (duration) => {
  const timeSlots = {
    'half-day-morning': { startTime: '09:00', endTime: '13:00' },
    'half-day-afternoon': { startTime: '14:00', endTime: '18:00' },
    'full-day': { startTime: '09:00', endTime: '18:00' },
    '2-hours': { startTime: '09:00', endTime: '11:00' },
    '4-hours': { startTime: '09:00', endTime: '13:00' }
  };
  
  return timeSlots[duration] || { startTime: '09:00', endTime: '17:00' };
};


const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};


const timeSlotsOverlap = (slot1Start, slot1End, slot2Start, slot2End) => {
  const start1 = timeToMinutes(slot1Start);
  const end1 = timeToMinutes(slot1End);
  const start2 = timeToMinutes(slot2Start);
  const end2 = timeToMinutes(slot2End);
  
  
  return Math.max(start1, start2) < Math.min(end1, end2);
};


const checkSlotAvailability = async (hallId, eventDate, newStartTime, newEndTime) => {
  try {
   
    const existingBookings = await Booking.find({
      hall: hallId,
      eventDate: {
        $gte: moment(eventDate).startOf('day').toDate(),
        $lte: moment(eventDate).endOf('day').toDate()
      },
      status: { $in: ['PENDING', 'APPROVED'] }
    });

    
    for (const booking of existingBookings) {
      const existingStart = booking.timeSlot.startTime;
      const existingEnd = booking.timeSlot.endTime;
      
      if (timeSlotsOverlap(newStartTime, newEndTime, existingStart, existingEnd)) {
        return {
          available: false,
          conflictingBooking: booking,
          reason: `Time slot conflicts with existing booking: ${existingStart} - ${existingEnd}`
        };
      }
    }

    return { available: true };
  } catch (error) {
    throw new Error('Error checking slot availability: ' + error.message);
  }
};


const createBooking = async (req, res) => {
  try {
    const { hallId, programmeName, eventDate, duration, numberOfSeats, guestsAttending, notes } = req.body;

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

    
    const timeSlot = getTimeSlots(duration);

    
    const availability = await checkSlotAvailability(
      hallId, 
      eventDate, 
      timeSlot.startTime, 
      timeSlot.endTime
    );

    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: availability.reason,
        conflictingBooking: availability.conflictingBooking
      });
    }

    
    const booking = await Booking.create({
      user: req.user.id,
      hall: hallId,
      programmeName,
      eventDate,
      duration,
      timeSlot,
      numberOfSeats,
      guestsAttending,
      notes
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


const updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

   
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

  
    if (req.body.duration) {
      req.body.timeSlot = getTimeSlots(req.body.duration);
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
    }).populate('user', 'name');

    
    const allTimeSlots = [
      { name: 'Half Day Morning', duration: 'half-day-morning', startTime: '09:00', endTime: '13:00' },
      { name: 'Half Day Afternoon', duration: 'half-day-afternoon', startTime: '14:00', endTime: '18:00' },
      { name: 'Full Day', duration: 'full-day', startTime: '09:00', endTime: '18:00' },
      { name: '2 Hours (Morning)', duration: '2-hours', startTime: '09:00', endTime: '11:00' },
      { name: '4 Hours (Morning)', duration: '4-hours', startTime: '09:00', endTime: '13:00' }
    ];

    const slotAvailability = allTimeSlots.map(slot => {
      const conflictingBookings = [];
      
      for (const booking of bookings) {
        if (timeSlotsOverlap(slot.startTime, slot.endTime, booking.timeSlot.startTime, booking.timeSlot.endTime)) {
          conflictingBookings.push(booking);
        }
      }
      
      return {
        ...slot,
        available: conflictingBookings.length === 0,
        conflictingBookings
      };
    });

  
    const isDayFullyBooked = slotAvailability.every(slot => !slot.available);

    res.json({
      success: true,
      data: {
        date,
        hallId,
        hallName: hall.name,
        totalBookings: bookings.length,
        isDayFullyBooked,
        bookings: bookings.map(booking => ({
          id: booking._id,
          programmeName: booking.programmeName,
          timeSlot: booking.timeSlot,
          duration: booking.duration,
          numberOfSeats: booking.numberOfSeats,
          status: booking.status,
          user: booking.user.name
        })),
        availableSlots: slotAvailability.filter(slot => slot.available),
        unavailableSlots: slotAvailability.filter(slot => !slot.available),
        allSlots: slotAvailability
      }
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
