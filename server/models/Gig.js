const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['web-development', 'mobile-development', 'design', 'writing', 'marketing', 'video-animation', 'music-audio', 'programming-tech', 'business', 'lifestyle']
  },
  subcategory: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  price: {
    type: Number,
    required: true,
    min: 1
  },
  deliveryTime: {
    type: Number,
    required: true,
    min: 1,
    max: 365 // Maximum 1 year
  },
  revisions: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  features: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    included: {
      type: Boolean,
      default: true
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  images: [{
    url: String,
    alt: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Text index for search functionality
gigSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  category: 'text',
  subcategory: 'text'
});

// Compound index for efficient filtering
gigSchema.index({ category: 1, isActive: 1, price: 1 });
gigSchema.index({ freelancer: 1, isActive: 1 });

// Virtual for formatted price
gigSchema.virtual('formattedPrice').get(function() {
  return `$${this.price}`;
});

// Virtual for delivery time in days
gigSchema.virtual('deliveryTimeText').get(function() {
  if (this.deliveryTime === 1) return '1 day';
  if (this.deliveryTime < 7) return `${this.deliveryTime} days`;
  if (this.deliveryTime < 30) return `${Math.ceil(this.deliveryTime / 7)} weeks`;
  return `${Math.ceil(this.deliveryTime / 30)} months`;
});

// Method to increment views
gigSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment orders
gigSchema.methods.incrementOrders = function() {
  this.orders += 1;
  return this.save();
};

// Method to update rating
gigSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Static method to get popular gigs
gigSchema.statics.getPopularGigs = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ views: -1, orders: -1 })
    .limit(limit)
    .populate('freelancer', 'username profile.firstName profile.lastName rating');
};

// Static method to get trending gigs
gigSchema.statics.getTrendingGigs = function(limit = 10) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.find({ 
    isActive: true, 
    createdAt: { $gte: thirtyDaysAgo } 
  })
    .sort({ views: -1, orders: -1 })
    .limit(limit)
    .populate('freelancer', 'username profile.firstName profile.lastName rating');
};

module.exports = mongoose.model('Gig', gigSchema); 