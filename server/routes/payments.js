const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { auth, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create Stripe payment intent for order
// @access  Private (Clients only)
router.post('/create-payment-intent', auth, authorizeRoles('client'), [
  body('orderId')
    .isMongoId()
    .withMessage('Valid order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.body;

    // Find the order
    const order = await Order.findById(orderId)
      .populate('gig')
      .populate('freelancer');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order
    if (order.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }

    // Check if order is already paid
    const existingPayment = await Payment.findOne({ order: orderId, status: { $in: ['completed', 'processing'] } });
    if (existingPayment) {
      return res.status(400).json({ message: 'Order is already paid or payment is in progress' });
    }

    // Calculate platform fee (10%)
    const platformFee = order.amount * 0.10;
    const totalAmount = order.amount + platformFee;

    // Create payment record
    const payment = new Payment({
      order: orderId,
      client: req.user._id,
      freelancer: order.freelancer._id,
      amount: order.amount,
      platformFee,
      freelancerAmount: order.amount - platformFee,
      paymentMethod: 'stripe'
    });

    await payment.save();

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: orderId,
        paymentId: payment._id.toString(),
        clientId: req.user._id.toString(),
        freelancerId: order.freelancer._id.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update payment with Stripe payment intent ID
    payment.stripePaymentIntentId = paymentIntent.id;
    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      amount: totalAmount
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Payment processing error' });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and release to escrow
// @access  Private
router.post('/confirm-payment', auth, [
  body('paymentId')
    .isMongoId()
    .withMessage('Valid payment ID is required'),
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentId, paymentIntentId } = req.body;

    // Find the payment
    const payment = await Payment.findById(paymentId)
      .populate('order')
      .populate('client')
      .populate('freelancer');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Update payment status
    payment.status = 'processing';
    payment.stripeChargeId = paymentIntent.latest_charge;
    payment.transactionId = paymentIntent.id;
    await payment.save();

    // Update order status to in-progress
    const order = await Order.findById(payment.order);
    order.status = 'in-progress';
    await order.save();

    res.json({
      message: 'Payment confirmed and held in escrow',
      payment: payment
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Payment confirmation error' });
  }
});

// @route   POST /api/payments/release-escrow
// @desc    Release payment from escrow to freelancer
// @access  Private (Client or Admin only)
router.post('/release-escrow', auth, [
  body('paymentId')
    .isMongoId()
    .withMessage('Valid payment ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate('order')
      .populate('client')
      .populate('freelancer');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is authorized (client who paid or admin)
    if (payment.client._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to release this payment' });
    }

    // Check if payment is in processing status
    if (payment.status !== 'processing') {
      return res.status(400).json({ message: 'Payment is not in escrow' });
    }

    // Transfer funds to freelancer (in real implementation, this would be a Stripe transfer)
    // For now, we'll just mark it as completed
    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();

    // Update order status to completed
    const order = await Order.findById(payment.order);
    order.status = 'completed';
    order.completedDate = new Date();
    await order.save();

    res.json({
      message: 'Payment released to freelancer',
      payment: payment
    });
  } catch (error) {
    console.error('Release escrow error:', error);
    res.status(500).json({ message: 'Escrow release error' });
  }
});

// @route   POST /api/payments/request-refund
// @desc    Request refund for payment
// @access  Private (Client only)
router.post('/request-refund', auth, authorizeRoles('client'), [
  body('paymentId')
    .isMongoId()
    .withMessage('Valid payment ID is required'),
  body('reason')
    .isLength({ min: 10, max: 500 })
    .withMessage('Refund reason must be between 10 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentId, reason } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate('order')
      .populate('client');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns the payment
    if (payment.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to refund this payment' });
    }

    // Check if payment can be refunded
    if (payment.status !== 'processing' && payment.status !== 'completed') {
      return res.status(400).json({ message: 'Payment cannot be refunded' });
    }

    // Process refund through Stripe
    if (payment.stripeChargeId) {
      const refund = await stripe.refunds.create({
        charge: payment.stripeChargeId,
        reason: 'requested_by_customer'
      });

      payment.status = 'refunded';
      payment.refundReason = reason;
      payment.refundedAt = new Date();
      await payment.save();

      // Update order status
      const order = await Order.findById(payment.order);
      order.status = 'cancelled';
      await order.save();
    }

    res.json({
      message: 'Refund processed successfully',
      payment: payment
    });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ message: 'Refund processing error' });
  }
});

// @route   GET /api/payments/my-payments
// @desc    Get user's payment history
// @access  Private
router.get('/my-payments', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (req.user.role === 'client') {
      filter.client = req.user._id;
    } else if (req.user.role === 'freelancer') {
      filter.freelancer = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    const payments = await Payment.find(filter)
      .populate('order')
      .populate('client', 'username profile.firstName profile.lastName')
      .populate('freelancer', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPayments: total,
        hasNext: skip + payments.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order')
      .populate('client', 'username profile.firstName profile.lastName')
      .populate('freelancer', 'username profile.firstName profile.lastName');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is authorized to view this payment
    if (payment.client._id.toString() !== req.user._id.toString() && 
        payment.freelancer._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 