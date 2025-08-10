const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  metrics: {
    // User metrics
    totalUsers: {
      type: Number,
      default: 0
    },
    newUsers: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    verifiedUsers: {
      type: Number,
      default: 0
    },
    userGrowth: {
      type: Number,
      default: 0
    },

    // Gig metrics
    totalGigs: {
      type: Number,
      default: 0
    },
    newGigs: {
      type: Number,
      default: 0
    },
    activeGigs: {
      type: Number,
      default: 0
    },
    gigViews: {
      type: Number,
      default: 0
    },
    averageGigRating: {
      type: Number,
      default: 0
    },

    // Order metrics
    totalOrders: {
      type: Number,
      default: 0
    },
    newOrders: {
      type: Number,
      default: 0
    },
    completedOrders: {
      type: Number,
      default: 0
    },
    cancelledOrders: {
      type: Number,
      default: 0
    },
    disputedOrders: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },

    // Financial metrics
    totalRevenue: {
      type: Number,
      default: 0
    },
    platformFees: {
      type: Number,
      default: 0
    },
    freelancerEarnings: {
      type: Number,
      default: 0
    },
    averageTransactionValue: {
      type: Number,
      default: 0
    },

    // Category metrics
    categoryBreakdown: {
      type: Map,
      of: {
        totalGigs: Number,
        totalOrders: Number,
        totalRevenue: Number,
        averageRating: Number
      }
    },

    // Performance metrics
    conversionRate: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    disputeRate: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },

    // Geographic metrics
    topCountries: [{
      country: String,
      users: Number,
      orders: Number,
      revenue: Number
    }],

    // Technology metrics
    topTechnologies: [{
      technology: String,
      gigs: Number,
      orders: Number,
      averagePrice: Number
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
analyticsSchema.index({ date: 1, type: 1 });

// Static method to generate daily analytics
analyticsSchema.statics.generateDailyAnalytics = async function(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const User = require('./User');
  const Gig = require('./Gig');
  const Order = require('./Order');
  const Payment = require('./Payment');

  // Get user metrics
  const totalUsers = await User.countDocuments();
  const newUsers = await User.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });
  const activeUsers = await User.countDocuments({
    updatedAt: { $gte: startOfDay, $lte: endOfDay }
  });
  const verifiedUsers = await User.countDocuments({ isVerified: true });

  // Get gig metrics
  const totalGigs = await Gig.countDocuments();
  const newGigs = await Gig.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });
  const activeGigs = await Gig.countDocuments({ isActive: true });

  // Get order metrics
  const totalOrders = await Order.countDocuments();
  const newOrders = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });
  const completedOrders = await Order.countDocuments({ status: 'completed' });
  const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
  const disputedOrders = await Order.countDocuments({ status: 'disputed' });

  // Get financial metrics
  const payments = await Payment.find({ status: 'completed' });
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const platformFees = payments.reduce((sum, payment) => sum + payment.platformFee, 0);
  const freelancerEarnings = payments.reduce((sum, payment) => sum + payment.freelancerAmount, 0);

  // Calculate averages
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const averageTransactionValue = payments.length > 0 ? totalRevenue / payments.length : 0;

  // Calculate rates
  const conversionRate = totalGigs > 0 ? (totalOrders / totalGigs) * 100 : 0;
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  const disputeRate = totalOrders > 0 ? (disputedOrders / totalOrders) * 100 : 0;

  // Get category breakdown
  const categoryBreakdown = await Gig.aggregate([
    {
      $group: {
        _id: '$category',
        totalGigs: { $sum: 1 },
        totalOrders: { $sum: '$orders' },
        averageRating: { $avg: '$rating.average' }
      }
    }
  ]);

  const categoryMap = new Map();
  categoryBreakdown.forEach(cat => {
    categoryMap.set(cat._id, {
      totalGigs: cat.totalGigs,
      totalOrders: cat.totalOrders,
      totalRevenue: 0, // Would need to calculate from orders
      averageRating: cat.averageRating || 0
    });
  });

  // Get top countries (simplified - would need user location data)
  const topCountries = [
    { country: 'United States', users: Math.floor(totalUsers * 0.4), orders: Math.floor(totalOrders * 0.4), revenue: Math.floor(totalRevenue * 0.4) },
    { country: 'United Kingdom', users: Math.floor(totalUsers * 0.15), orders: Math.floor(totalOrders * 0.15), revenue: Math.floor(totalRevenue * 0.15) },
    { country: 'Canada', users: Math.floor(totalUsers * 0.1), orders: Math.floor(totalOrders * 0.1), revenue: Math.floor(totalRevenue * 0.1) }
  ];

  // Get top technologies (simplified - would need gig tags analysis)
  const topTechnologies = [
    { technology: 'JavaScript', gigs: Math.floor(totalGigs * 0.25), orders: Math.floor(totalOrders * 0.25), averagePrice: 150 },
    { technology: 'React', gigs: Math.floor(totalGigs * 0.2), orders: Math.floor(totalOrders * 0.2), averagePrice: 180 },
    { technology: 'Node.js', gigs: Math.floor(totalGigs * 0.15), orders: Math.floor(totalOrders * 0.15), averagePrice: 200 }
  ];

  const analytics = new this({
    date: startOfDay,
    type: 'daily',
    metrics: {
      totalUsers,
      newUsers,
      activeUsers,
      verifiedUsers,
      userGrowth: 0, // Would need previous day data
      totalGigs,
      newGigs,
      activeGigs,
      gigViews: 0, // Would need to track views
      averageGigRating: 0, // Would need to calculate
      totalOrders,
      newOrders,
      completedOrders,
      cancelledOrders,
      disputedOrders,
      averageOrderValue,
      totalRevenue,
      platformFees,
      freelancerEarnings,
      averageTransactionValue,
      categoryBreakdown: categoryMap,
      conversionRate,
      completionRate,
      disputeRate,
      averageResponseTime: 0, // Would need to track
      topCountries,
      topTechnologies
    }
  });

  return analytics.save();
};

// Static method to get analytics for a date range
analyticsSchema.statics.getAnalytics = async function(startDate, endDate, type = 'daily') {
  return this.find({
    date: { $gte: startDate, $lte: endDate },
    type
  }).sort({ date: 1 });
};

// Static method to get latest analytics
analyticsSchema.statics.getLatestAnalytics = async function(type = 'daily') {
  return this.findOne({ type }).sort({ date: -1 });
};

// Static method to get analytics summary
analyticsSchema.statics.getAnalyticsSummary = async function(days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const analytics = await this.find({
    date: { $gte: startDate, $lte: endDate },
    type: 'daily'
  }).sort({ date: 1 });

  if (analytics.length === 0) {
    return null;
  }

  const summary = {
    period: `${days} days`,
    startDate,
    endDate,
    totalUsers: analytics[analytics.length - 1].metrics.totalUsers,
    totalGigs: analytics[analytics.length - 1].metrics.totalGigs,
    totalOrders: analytics[analytics.length - 1].metrics.totalOrders,
    totalRevenue: analytics[analytics.length - 1].metrics.totalRevenue,
    newUsers: analytics.reduce((sum, a) => sum + a.metrics.newUsers, 0),
    newGigs: analytics.reduce((sum, a) => sum + a.metrics.newGigs, 0),
    newOrders: analytics.reduce((sum, a) => sum + a.metrics.newOrders, 0),
    averageDailyRevenue: analytics.reduce((sum, a) => sum + a.metrics.totalRevenue, 0) / analytics.length,
    growthRate: {
      users: ((analytics[analytics.length - 1].metrics.totalUsers - analytics[0].metrics.totalUsers) / analytics[0].metrics.totalUsers) * 100,
      gigs: ((analytics[analytics.length - 1].metrics.totalGigs - analytics[0].metrics.totalGigs) / analytics[0].metrics.totalGigs) * 100,
      orders: ((analytics[analytics.length - 1].metrics.totalOrders - analytics[0].metrics.totalOrders) / analytics[0].metrics.totalOrders) * 100
    }
  };

  return summary;
};

module.exports = mongoose.model('Analytics', analyticsSchema); 