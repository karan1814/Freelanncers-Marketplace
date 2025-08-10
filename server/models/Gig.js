const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['web-development', 'mobile-development', 'design', 'writing', 'marketing', 'video-animation', 'music-audio', 'programming-tech', 'business', 'lifestyle']
  },
  subcategory: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 1
  },
  deliveryTime: {
    type: Number,
    required: true,
    min: 1
  },
  revisions: {
    type: Number,
    default: 0
  },
  features: [{
    name: String,
    included: { type: Boolean, default: true }
  }],
  images: [{
    url: String,
    alt: String
  }],
  tags: [String],
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  orders: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for search functionality
gigSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for formatted price
gigSchema.virtual('formattedPrice').get(function() {
  return `$${this.price}`;
});

// Virtual for formatted delivery time
gigSchema.virtual('formattedDeliveryTime').get(function() {
  if (this.deliveryTime === 1) {
    return '1 day';
  } else if (this.deliveryTime < 7) {
    return `${this.deliveryTime} days`;
  } else if (this.deliveryTime === 7) {
    return '1 week';
  } else {
    const weeks = Math.floor(this.deliveryTime / 7);
    const days = this.deliveryTime % 7;
    if (days === 0) {
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
      return `${weeks} week${weeks > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
    }
  }
});

module.exports = mongoose.model('Gig', gigSchema); 