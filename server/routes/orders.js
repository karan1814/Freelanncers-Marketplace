const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Gig = require('../models/Gig');
const { auth, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (Clients only)
router.post('/', auth, authorizeRoles('client'), [
  body('gigId')
    .isMongoId()
    .withMessage('Valid gig ID is required'),
  body('requirements')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Requirements must be between 10 and 2000 characters'),
  body('deliveryDate')
    .isISO8601()
    .withMessage('Valid delivery date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gigId, requirements, deliveryDate } = req.body;

    // Check if gig exists and is active
    const gig = await Gig.findById(gigId);
    if (!gig || !gig.isActive) {
      return res.status(404).json({ message: 'Gig not found or inactive' });
    }

    // Check if client is not the freelancer
    if (gig.freelancer.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot order your own gig' });
    }

    // Calculate delivery date
    const deliveryDateObj = new Date(deliveryDate);
    if (deliveryDateObj <= new Date()) {
      return res.status(400).json({ message: 'Delivery date must be in the future' });
    }

    const order = new Order({
      gig: gigId,
      client: req.user._id,
      freelancer: gig.freelancer,
      amount: gig.price,
      requirements,
      deliveryDate: deliveryDateObj,
      revisions: {
        maxAllowed: gig.revisions
      }
    });

    await order.save();

    // Increment gig orders count
    gig.orders += 1;
    await gig.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('gig', 'title price')
      .populate('client', 'username profile.firstName profile.lastName')
      .populate('freelancer', 'username profile.firstName profile.lastName');

    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get current user's orders (as client or freelancer)
// @access  Private
router.get('/my-orders', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'client' 
      ? { client: req.user._id }
      : { freelancer: req.user._id };

    const orders = await Order.find(filter)
      .populate('gig', 'title price images')
      .populate('client', 'username profile.firstName profile.lastName')
      .populate('freelancer', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private (Order participants only)
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('gig', 'title price description images')
      .populate('client', 'username profile.firstName profile.lastName')
      .populate('freelancer', 'username profile.firstName profile.lastName')
      .populate('messages.sender', 'username profile.firstName profile.lastName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is part of the order
    if (order.client._id.toString() !== req.user._id.toString() && 
        order.freelancer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Order participants only)
router.put('/:id/status', auth, [
  body('status')
    .isIn(['pending', 'in-progress', 'completed', 'cancelled', 'disputed'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is part of the order
    if (order.client.toString() !== req.user._id.toString() && 
        order.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Status transition rules
    const allowedTransitions = {
      pending: ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'disputed'],
      completed: [],
      cancelled: [],
      disputed: ['in-progress', 'cancelled']
    };

    if (!allowedTransitions[order.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${order.status} to ${status}` 
      });
    }

    order.status = status;
    
    if (status === 'completed') {
      order.completedDate = new Date();
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('gig', 'title price')
      .populate('client', 'username profile.firstName profile.lastName')
      .populate('freelancer', 'username profile.firstName profile.lastName');

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders/:id/messages
// @desc    Add message to order
// @access  Private (Order participants only)
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
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is part of the order
    if (order.client.toString() !== req.user._id.toString() && 
        order.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to message this order' });
    }

    order.messages.push({
      sender: req.user._id,
      message
    });

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('messages.sender', 'username profile.firstName profile.lastName');

    res.json({
      message: 'Message added successfully',
      messages: updatedOrder.messages
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders/:id/rating
// @desc    Rate an order (clients only)
// @access  Private (Client only)
router.post('/:id/rating', auth, authorizeRoles('client'), [
  body('score')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Review must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { score, review } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is the client
    if (order.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the client can rate this order' });
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed orders' });
    }

    // Check if already rated
    if (order.rating.score) {
      return res.status(400).json({ message: 'Order already rated' });
    }

    order.rating = {
      score,
      review,
      createdAt: new Date()
    };

    await order.save();

    res.json({
      message: 'Order rated successfully',
      rating: order.rating
    });
  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 