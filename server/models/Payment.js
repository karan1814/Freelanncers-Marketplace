const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
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
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  platformFee: {
    type: Number,
    default: 0
  },
  freelancerAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer'],
    required: true
  },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  paypalPaymentId: String,
  transactionId: String,
  escrowReleaseDate: Date,
  refundReason: String,
  disputeReason: String,
  metadata: {
    type: Map,
    of: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  refundedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
paymentSchema.index({ order: 1 });
paymentSchema.index({ client: 1, status: 1 });
paymentSchema.index({ freelancer: 1, status: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ paypalPaymentId: 1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Virtual for formatted freelancer amount
paymentSchema.virtual('formattedFreelancerAmount').get(function() {
  return `$${this.freelancerAmount.toFixed(2)}`;
});

// Method to calculate platform fee (10% of order amount)
paymentSchema.methods.calculatePlatformFee = function() {
  this.platformFee = this.amount * 0.10;
  this.freelancerAmount = this.amount - this.platformFee;
  return this;
};

// Method to mark payment as completed
paymentSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markFailed = function() {
  this.status = 'failed';
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(reason) {
  this.status = 'refunded';
  this.refundReason = reason;
  this.refundedAt = new Date();
  return this.save();
};

// Method to dispute payment
paymentSchema.methods.disputePayment = function(reason) {
  this.status = 'disputed';
  this.disputeReason = reason;
  return this.save();
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(userId, timeframe = '30d') {
  const dateFilter = {};
  if (timeframe === '7d') {
    dateFilter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  } else if (timeframe === '30d') {
    dateFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  } else if (timeframe === '90d') {
    dateFilter.createdAt = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
  }

  const stats = await this.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);

  return stats[0] || { totalAmount: 0, totalPayments: 0, averageAmount: 0 };
};

module.exports = mongoose.model('Payment', paymentSchema); 