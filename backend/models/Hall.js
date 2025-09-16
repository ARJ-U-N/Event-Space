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
    whiteboard: { type: Boolean, default: false }
  },
  images: [{
    url: String,
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  pricePerHour: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hall', hallSchema);
