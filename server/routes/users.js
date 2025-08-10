const express = require('express');
const User = require('../models/User');
const Gig = require('../models/Gig');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/gigs
// @desc    Get user's gigs
// @access  Public
router.get('/:id/gigs', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'freelancer') {
      return res.status(400).json({ message: 'User is not a freelancer' });
    }

    const gigs = await Gig.find({ 
      freelancer: req.params.id, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({ gigs });
  } catch (error) {
    console.error('Get user gigs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/reviews
// @desc    Get user's reviews
// @access  Public
router.get('/:id/reviews', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get reviews from orders where user is the freelancer
    const Order = require('../models/Order');
    const reviews = await Order.find({
      freelancer: req.params.id,
      'rating.score': { $exists: true, $ne: null }
    })
    .populate('client', 'username profile.firstName profile.lastName')
    .populate('gig', 'title')
    .select('rating createdAt')
    .sort({ 'rating.createdAt': -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'profile.firstName',
      'profile.lastName', 
      'profile.bio',
      'profile.skills',
      'profile.hourlyRate',
      'profile.location',
      'profile.phone'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        const keys = field.split('.');
        if (keys.length === 2) {
          if (!user[keys[0]]) user[keys[0]] = {};
          user[keys[0]][keys[1]] = updates[field];
        }
      }
    });

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, role, skills } = req.query;
    
    const filter = {};
    
    if (role) {
      filter.role = role;
    }
    
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { 'profile.firstName': { $regex: q, $options: 'i' } },
        { 'profile.lastName': { $regex: q, $options: 'i' } }
      ];
    }
    
    if (skills) {
      filter['profile.skills'] = { $in: skills.split(',') };
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ 'rating.average': -1 })
      .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 