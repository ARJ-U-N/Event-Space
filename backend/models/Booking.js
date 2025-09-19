const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // RENAMED: user -> requestedBy to be more specific
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: true
  },
  programmeName: {
    type: String,
    required: [true, 'Please provide programme name'],
    trim: true
  },
  eventDate: {
    type: Date,
    required: [true, 'Please provide event date']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide start time'],
    validate: {
      validator: function(v) {
        return v && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  endTime: {
    type: String,
    required: [true, 'Please provide end time'],
    validate: {
      validator: function(v) {
        return v && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:MM format'
    }
  },
  duration: {
    type: String,
    enum: ['custom', 'half-day-morning', 'half-day-afternoon', 'full-day', '2-hours', '4-hours'],
    default: 'custom'
  },
  timeSlot: {
    startTime: String,
    endTime: String
  },
  numberOfSeats: {
    type: Number,
    required: [true, 'Please provide number of seats'],
    min: [1, 'Number of seats must be at least 1']
  },
  guestsAttending: {
    type: Boolean,
    default: false
  },
  equipmentRequirements: {
    ac: {
      type: Boolean,
      default: false
    },
    projector: {
      type: Boolean,
      default: false
    }
  },
  extraRequirements: {
    type: String,
    trim: true,
    maxLength: [500, 'Extra requirements cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING'
  },
  notes: {
    type: String,
    trim: true
  },
  // RENAMED: approvedBy -> respondedBy to handle both approve/reject
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // RENAMED: approvalDate -> responseDate
  responseDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // NEW: Admin notes when responding to request
  adminNotes: {
    type: String,
    trim: true,
    maxLength: [500, 'Admin notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Validation middleware with proper error handling
bookingSchema.pre('save', function(next) {
  try {
    // Check if we have valid time values before processing
    if (!this.startTime || !this.endTime) {
      return next(new Error('Start time and end time are required'));
    }

    // Validate operating hours (7 AM to 6 PM)
    const timeToMinutes = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') {
        throw new Error('Invalid time format');
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

    const startMinutes = timeToMinutes(this.startTime);
    const endMinutes = timeToMinutes(this.endTime);
    const operatingStart = 7 * 60; // 7 AM
    const operatingEnd = 18 * 60; // 6 PM

    if (startMinutes < operatingStart || endMinutes > operatingEnd) {
      return next(new Error('Booking time must be between 7:00 AM and 6:00 PM'));
    }

    if (endMinutes <= startMinutes) {
      return next(new Error('End time must be after start time'));
    }

    const durationHours = (endMinutes - startMinutes) / 60;
    if (durationHours < 1) {
      return next(new Error('Minimum booking duration is 1 hour'));
    }

    // Set timeSlot for backward compatibility
    this.timeSlot = {
      startTime: this.startTime,
      endTime: this.endTime
    };

    next();
  } catch (error) {
    next(error);
  }
});

// FIXED: Index for efficient queries using bookingSchema (not hallSchema)
bookingSchema.index({ hall: 1, eventDate: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ requestedBy: 1, status: 1 }); // UPDATED: user -> requestedBy
bookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
