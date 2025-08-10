const express = require('express');
const { body, validationResult } = require('express-validator');
const Dispute = require('../models/Dispute');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { auth, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/disputes
// @desc    Create a new dispute
// @access  Private
router.post('/', auth, [
  body('orderId')
    .isMongoId()
    .withMessage('Valid order ID is required'),
  body('type')
    .isIn(['quality', 'delivery', 'communication', 'payment', 'other'])
    .withMessage('Invalid dispute type'),
  body('reason')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, type, reason } = req.body;

    // Find the order
    const order = await Order.findById(orderId)
      .populate('client')
      .populate('freelancer');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is part of the order
    const isClient = order.client._id.toString() === req.user._id.toString();
    const isFreelancer = order.freelancer._id.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Not authorized to create dispute for this order' });
    }

    // Check if dispute already exists
    const existingDispute = await Dispute.findOne({ order: orderId });
    if (existingDispute) {
      return res.status(400).json({ message: 'Dispute already exists for this order' });
    }

    // Determine initiator and respondent
    const initiator = req.user._id;
    const respondent = isClient ? order.freelancer._id : order.client._id;

    // Create dispute
    const dispute = new Dispute({
      order: orderId,
      initiator,
      respondent,
      type,
      reason
    });

    await dispute.save();

    // Update order status
    order.status = 'disputed';
    await order.save();

    // Populate dispute with user details
    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('initiator', 'username profile.firstName profile.lastName')
      .populate('respondent', 'username profile.firstName profile.lastName')
      .populate('order');

    res.status(201).json({
      message: 'Dispute created successfully',
      dispute: populatedDispute
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/disputes/my-disputes
// @desc    Get user's disputes
// @access  Private
router.get('/my-disputes', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      $or: [
        { initiator: req.user._id },
        { respondent: req.user._id }
      ]
    };

    if (status) {
      filter.status = status;
    }

    const disputes = await Dispute.find(filter)
      .populate('order')
      .populate('initiator', 'username profile.firstName profile.lastName')
      .populate('respondent', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Dispute.countDocuments(filter);

    res.json({
      disputes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDisputes: total,
        hasNext: skip + disputes.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/disputes/:id
// @desc    Get dispute details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('order')
      .populate('initiator', 'username profile.firstName profile.lastName')
      .populate('respondent', 'username profile.firstName profile.lastName')
      .populate('assignedAdmin', 'username profile.firstName profile.lastName')
      .populate('messages.sender', 'username profile.firstName profile.lastName')
      .populate('evidence.uploadedBy', 'username profile.firstName profile.lastName');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Check if user is authorized to view this dispute
    if (dispute.initiator.toString() !== req.user._id.toString() && 
        dispute.respondent.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this dispute' });
    }

    res.json({ dispute });
  } catch (error) {
    console.error('Get dispute error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/disputes/:id/messages
// @desc    Add message to dispute
// @access  Private
router.post('/:id/messages', auth, [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Check if user is authorized to add messages
    if (dispute.initiator.toString() !== req.user._id.toString() && 
        dispute.respondent.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add messages to this dispute' });
    }

    // Add message
    await dispute.addMessage({ message }, req.user._id, req.user.role === 'admin');

    // Populate the new message
    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('messages.sender', 'username profile.firstName profile.lastName');

    const newMessage = populatedDispute.messages[populatedDispute.messages.length - 1];

    res.json({
      message: 'Message added successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Add dispute message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/disputes/:id/evidence
// @desc    Add evidence to dispute
// @access  Private
router.post('/:id/evidence', auth, [
  body('type')
    .isIn(['message', 'file', 'screenshot', 'other'])
    .withMessage('Invalid evidence type'),
  body('description')
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('fileUrl')
    .optional()
    .isURL()
    .withMessage('Valid file URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, description, fileUrl } = req.body;
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Check if user is authorized to add evidence
    if (dispute.initiator.toString() !== req.user._id.toString() && 
        dispute.respondent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add evidence to this dispute' });
    }

    // Add evidence
    await dispute.addEvidence({ type, description, fileUrl }, req.user._id);

    res.json({
      message: 'Evidence added successfully'
    });
  } catch (error) {
    console.error('Add dispute evidence error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/disputes/:id/resolve
// @desc    Resolve dispute (Admin only)
// @access  Private (Admin only)
router.put('/:id/resolve', auth, authorizeRoles('admin'), [
  body('resolution')
    .isIn(['refund_full', 'refund_partial', 'continue_work', 'revision', 'cancelled'])
    .withMessage('Invalid resolution type'),
  body('adminNotes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Admin notes must be less than 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { resolution, adminNotes } = req.body;
    const dispute = await Dispute.findById(req.params.id)
      .populate('order')
      .populate('initiator')
      .populate('respondent');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Resolve dispute
    await dispute.resolve(resolution, adminNotes);

    // Handle resolution actions
    const order = dispute.order;
    const payment = await Payment.findOne({ order: order._id });

    switch (resolution) {
      case 'refund_full':
        if (payment) {
          await payment.processRefund('Dispute resolution - full refund');
        }
        order.status = 'cancelled';
        break;
      case 'refund_partial':
        if (payment) {
          await payment.processRefund('Dispute resolution - partial refund');
        }
        order.status = 'in-progress';
        break;
      case 'continue_work':
        order.status = 'in-progress';
        break;
      case 'revision':
        order.status = 'in-progress';
        break;
      case 'cancelled':
        order.status = 'cancelled';
        break;
    }

    await order.save();

    res.json({
      message: 'Dispute resolved successfully',
      dispute
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/disputes/stats/overview
// @desc    Get dispute statistics (Admin only)
// @access  Private (Admin only)
router.get('/stats/overview', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const stats = await Dispute.getDisputeStats(timeframe);

    res.json({ stats });
  } catch (error) {
    console.error('Get dispute stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/disputes/admin/all
// @desc    Get all disputes (Admin only)
// @access  Private (Admin only)
router.get('/admin/all', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const disputes = await Dispute.find(filter)
      .populate('order')
      .populate('initiator', 'username profile.firstName profile.lastName')
      .populate('respondent', 'username profile.firstName profile.lastName')
      .populate('assignedAdmin', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Dispute.countDocuments(filter);

    res.json({
      disputes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDisputes: total,
        hasNext: skip + disputes.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get all disputes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 