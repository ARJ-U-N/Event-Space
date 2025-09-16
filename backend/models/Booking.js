const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
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
  duration: {
    type: String,
    required: [true, 'Please provide duration'],
    enum: ['half-day-morning', 'half-day-afternoon', 'full-day', '2-hours', '4-hours']
  },
  timeSlot: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
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
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING'
  },
  notes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ hall: 1, eventDate: 1, status: 1 });
bookingSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
