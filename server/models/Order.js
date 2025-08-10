const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  requirements: {
    type: String,
    required: true,
    maxlength: 2000
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  rating: {
    score: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 1000 },
    createdAt: Date
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliverables: [{
    title: String,
    description: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  revisions: {
    requested: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    maxAllowed: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for order duration
orderSchema.virtual('duration').get(function() {
  if (this.completedDate) {
    return Math.ceil((this.completedDate - this.createdAt) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for formatted amount
orderSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount}`;
});

// Method to check if order is overdue
orderSchema.methods.isOverdue = function() {
  return new Date() > this.deliveryDate && this.status !== 'completed' && this.status !== 'cancelled';
};

// Method to get days remaining
orderSchema.methods.getDaysRemaining = function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return 0;
  }
  const daysRemaining = Math.ceil((this.deliveryDate - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
};

module.exports = mongoose.model('Order', orderSchema); 