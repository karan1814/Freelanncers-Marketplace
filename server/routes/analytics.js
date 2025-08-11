const express = require('express');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Gig = require('../models/Gig');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { auth, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/analytics/generate
// @desc    Generate analytics for a specific date (Admin only)
// @access  Private (Admin only)
router.post('/generate', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { date, type = 'daily' } = req.body;
    
    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date);
    }

    let analytics;
    if (type === 'daily') {
      analytics = await Analytics.generateDailyAnalytics(targetDate);
    } else {
      // Weekly and monthly analytics would need more complex logic
      return res.status(400).json({ message: 'Only daily analytics are supported for now' });
    }

    res.json({
      message: 'Analytics generated successfully',
      analytics
    });
  } catch (error) {
    console.error('Generate analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/overview
// @desc    Get analytics overview (Admin only)
// @access  Private (Admin only)
router.get('/overview', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Get latest analytics
    const latestAnalytics = await Analytics.getLatestAnalytics('daily');
    
    // Get analytics summary
    const summary = await Analytics.getAnalyticsSummary(parseInt(days));
    
    // Get real-time metrics
    const totalUsers = await User.countDocuments();
    const totalGigs = await Gig.countDocuments();
    const totalOrders = await Order.countDocuments();
    const activeGigs = await Gig.countDocuments({ isActive: true });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    
    // Get financial metrics
    const payments = await Payment.find({ status: 'completed' });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const platformFees = payments.reduce((sum, payment) => sum + payment.platformFee, 0);
    
    const overview = {
      current: {
        totalUsers,
        totalGigs,
        totalOrders,
        activeGigs,
        completedOrders,
        pendingOrders,
        totalRevenue,
        platformFees
      },
      summary,
      latestAnalytics: latestAnalytics?.metrics || null
    };

    res.json(overview);
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/trends
// @desc    Get analytics trends (Admin only)
// @access  Private (Admin only)
router.get('/trends', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { startDate, endDate, type = 'daily' } = req.query;
    
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to last 30 days
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 30);
    }

    const analytics = await Analytics.getAnalytics(start, end, type);
    
    const trends = {
      period: { start, end },
      data: analytics.map(a => ({
        date: a.date,
        metrics: a.metrics
      }))
    };

    res.json(trends);
  } catch (error) {
    console.error('Get analytics trends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/categories
// @desc    Get category analytics (Admin only)
// @access  Private (Admin only)
router.get('/categories', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const categoryStats = await Gig.aggregate([
      {
        $group: {
          _id: '$category',
          totalGigs: { $sum: 1 },
          activeGigs: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalOrders: { $sum: '$orders' },
          totalViews: { $sum: '$views' },
          averageRating: { $avg: '$rating.average' },
          averagePrice: { $avg: '$price' }
        }
      },
      {
        $sort: { totalGigs: -1 }
      }
    ]);

    res.json({
      categories: categoryStats
    });
  } catch (error) {
    console.error('Get category analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/users
// @desc    Get user analytics (Admin only)
// @access  Private (Admin only)
router.get('/users', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let dateFilter = {};
    if (timeframe === '7d') {
      dateFilter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '30d') {
      dateFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '90d') {
      dateFilter.createdAt = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
    }

    const userStats = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          verifiedCount: { $sum: { $cond: ['$isVerified', 1, 0] } },
          averageRating: { $avg: '$rating.average' }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const newUsers = await User.countDocuments(dateFilter);

    res.json({
      totalUsers,
      verifiedUsers,
      newUsers,
      byRole: userStats,
      verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/financial
// @desc    Get financial analytics (Admin only)
// @access  Private (Admin only)
router.get('/financial', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let dateFilter = {};
    if (timeframe === '7d') {
      dateFilter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '30d') {
      dateFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '90d') {
      dateFilter.createdAt = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
    }

    const paymentStats = await Payment.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalFees: { $sum: '$platformFee' },
          totalFreelancerEarnings: { $sum: '$freelancerAmount' },
          averageTransaction: { $avg: '$amount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    const orderStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const financial = {
      payments: paymentStats[0] || {
        totalRevenue: 0,
        totalFees: 0,
        totalFreelancerEarnings: 0,
        averageTransaction: 0,
        totalTransactions: 0
      },
      orders: orderStats,
      timeframe
    };

    res.json(financial);
  } catch (error) {
    console.error('Get financial analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/performance
// @desc    Get performance metrics (Admin only)
// @access  Private (Admin only)
router.get('/performance', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const disputedOrders = await Order.countDocuments({ status: 'disputed' });
    const totalGigs = await Gig.countDocuments();
    const activeGigs = await Gig.countDocuments({ isActive: true });

    const performance = {
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0,
      disputeRate: totalOrders > 0 ? (disputedOrders / totalOrders) * 100 : 0,
      gigActivationRate: totalGigs > 0 ? (activeGigs / totalGigs) * 100 : 0,
      averageOrderValue: totalOrders > 0 ? await Order.aggregate([
        { $group: { _id: null, average: { $avg: '$amount' } } }
      ]).then(result => result[0]?.average || 0) : 0,
      averageGigRating: await Gig.aggregate([
        { $group: { _id: null, average: { $avg: '$rating.average' } } }
      ]).then(result => result[0]?.average || 0)
    };

    res.json(performance);
  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data (Admin only)
// @access  Private (Admin only)
router.get('/export', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { startDate, endDate, type = 'daily' } = req.query;
    
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 30);
    }

    const analytics = await Analytics.getAnalytics(start, end, type);
    
    // Format data for export
    const exportData = analytics.map(a => ({
      date: a.date.toISOString().split('T')[0],
      type: a.type,
      totalUsers: a.metrics.totalUsers,
      newUsers: a.metrics.newUsers,
      totalGigs: a.metrics.totalGigs,
      newGigs: a.metrics.newGigs,
      totalOrders: a.metrics.totalOrders,
      newOrders: a.metrics.newOrders,
      totalRevenue: a.metrics.totalRevenue,
      platformFees: a.metrics.platformFees,
      conversionRate: a.metrics.conversionRate,
      completionRate: a.metrics.completionRate,
      disputeRate: a.metrics.disputeRate
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.json`);
    
    res.json(exportData);
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 