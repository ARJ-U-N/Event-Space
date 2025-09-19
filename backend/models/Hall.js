const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide hall name'],
    trim: true,
    maxLength: [100, 'Hall name cannot be more than 100 characters']
  },
  number: {
    type: String,
    required: [true, 'Please provide hall number'],
    unique: true,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Please provide hall location'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide hall capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  features: {
    type: [String],
    default: ['AC', 'NON-AC']
  },
  amenities: {
    projector: { type: Boolean, default: false },
    microphone: { type: Boolean, default: false },
    speakers: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    whiteboard: { type: Boolean, default: false },
    ac: { type: Boolean, default: false } // ADDED AC amenity
  },
  images: [{
    url: String,
    description: String
  }],
  // NEW: Admin who created/manages this hall
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pricePerHour: {
    type: Number,
    default: 0
  },
  // NEW: Operating hours for the hall
  operatingHours: {
    start: {
      type: String,
      default: '07:00'
    },
    end: {
      type: String,
      default: '18:00'
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
hallSchema.index({ createdBy: 1, isActive: 1 });
hallSchema.index({ number: 1 });

module.exports = mongoose.model('Hall', hallSchema);
