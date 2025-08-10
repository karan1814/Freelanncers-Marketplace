const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, [
  body('orderId')
    .isMongoId()
    .withMessage('Valid order ID is required'),
  body('message')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'file', 'image', 'system'])
    .withMessage('Invalid message type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, message, messageType = 'text', attachments = [] } = req.body;

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
      return res.status(403).json({ message: 'Not authorized to send messages for this order' });
    }

    // Determine recipient
    const recipient = isClient ? order.freelancer._id : order.client._id;

    // Create message
    const newMessage = new Message({
      order: orderId,
      sender: req.user._id,
      recipient,
      message,
      messageType,
      attachments
    });

    await newMessage.save();

    // Populate sender and recipient info
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username profile.firstName profile.lastName profile.avatar')
      .populate('recipient', 'username profile.firstName profile.lastName profile.avatar');

    // Emit real-time message (if using Socket.IO)
    // io.to(`order_${orderId}`).emit('new_message', populatedMessage);

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/order/:orderId
// @desc    Get messages for an order
// @access  Private
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { page = 1, limit = 50 } = req.query;

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
      return res.status(403).json({ message: 'Not authorized to view messages for this order' });
    }

    // Get messages
    const result = await Message.getConversation(orderId, page, limit);

    res.json(result);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('order');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the recipient
    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }

    await message.markAsRead();

    res.json({
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user._id);

    res.json({
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders where user is involved
    const orders = await Order.find({
      $or: [
        { client: req.user._id },
        { freelancer: req.user._id }
      ]
    }).select('_id');

    const orderIds = orders.map(order => order._id);

    // Get latest message for each order
    const conversations = await Message.aggregate([
      {
        $match: {
          order: { $in: orderIds }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$order',
          latestMessage: { $first: '$$ROOT' }
        }
      },
      {
        $sort: { 'latestMessage.createdAt': -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Populate order and user details
    const populatedConversations = await Message.populate(conversations, [
      {
        path: 'latestMessage.sender',
        select: 'username profile.firstName profile.lastName profile.avatar'
      },
      {
        path: 'latestMessage.recipient',
        select: 'username profile.firstName profile.lastName profile.avatar'
      },
      {
        path: '_id',
        model: 'Order',
        populate: [
          {
            path: 'client',
            select: 'username profile.firstName profile.lastName'
          },
          {
            path: 'freelancer',
            select: 'username profile.firstName profile.lastName'
          },
          {
            path: 'gig',
            select: 'title'
          }
        ]
      }
    ]);

    const total = await Message.aggregate([
      {
        $match: {
          order: { $in: orderIds }
        }
      },
      {
        $group: {
          _id: '$order'
        }
      },
      {
        $count: 'total'
      }
    ]);

    res.json({
      conversations: populatedConversations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((total[0]?.total || 0) / parseInt(limit)),
        totalConversations: total[0]?.total || 0,
        hasNext: skip + conversations.length < (total[0]?.total || 0),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message (only sender can delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 