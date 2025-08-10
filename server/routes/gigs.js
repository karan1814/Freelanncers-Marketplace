const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Gig = require('../models/Gig');
const User = require('../models/User');
const { auth, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/gigs
// @desc    Get all gigs with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sort').optional().isIn(['price', 'rating', 'createdAt', 'orders'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      sort = 'createdAt'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    const sortObj = {};
    if (sort === 'price') sortObj.price = 1;
    else if (sort === 'rating') sortObj['rating.average'] = -1;
    else if (sort === 'orders') sortObj.orders = -1;
    else sortObj.createdAt = -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const gigs = await Gig.find(filter)
      .populate('freelancer', 'username profile.firstName profile.lastName rating')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Gig.countDocuments(filter);

    res.json({
      gigs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalGigs: total,
        hasNext: skip + gigs.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get gigs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gigs/:id
// @desc    Get gig by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('freelancer', 'username profile rating');

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Increment views
    gig.views += 1;
    await gig.save();

    res.json({ gig });
  } catch (error) {
    console.error('Get gig error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/gigs
// @desc    Create a new gig
// @access  Private (Freelancers only)
router.post('/', auth, authorizeRoles('freelancer'), [
  body('title')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .isIn(['web-development', 'mobile-development', 'design', 'writing', 'marketing', 'video-animation', 'music-audio', 'programming-tech', 'business', 'lifestyle'])
    .withMessage('Invalid category'),
  body('subcategory')
    .isLength({ min: 1, max: 50 })
    .withMessage('Subcategory must be between 1 and 50 characters'),
  body('price')
    .isFloat({ min: 1 })
    .withMessage('Price must be a positive number'),
  body('deliveryTime')
    .isInt({ min: 1 })
    .withMessage('Delivery time must be a positive integer'),
  body('revisions')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Revisions must be a non-negative integer'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with maximum 10 items')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const gigData = {
      ...req.body,
      freelancer: req.user._id
    };

    const gig = new Gig(gigData);
    await gig.save();

    const populatedGig = await Gig.findById(gig._id)
      .populate('freelancer', 'username profile.firstName profile.lastName');

    res.status(201).json({
      message: 'Gig created successfully',
      gig: populatedGig
    });
  } catch (error) {
    console.error('Create gig error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/gigs/:id
// @desc    Update a gig
// @access  Private (Gig owner only)
router.put('/:id', auth, authorizeRoles('freelancer'), [
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Price must be a positive number'),
  body('deliveryTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Delivery time must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Check if user owns the gig
    if (gig.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this gig' });
    }

    // Update gig
    Object.keys(req.body).forEach(key => {
      if (key !== 'freelancer' && key !== '_id') {
        gig[key] = req.body[key];
      }
    });

    await gig.save();

    const updatedGig = await Gig.findById(gig._id)
      .populate('freelancer', 'username profile.firstName profile.lastName');

    res.json({
      message: 'Gig updated successfully',
      gig: updatedGig
    });
  } catch (error) {
    console.error('Update gig error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/gigs/:id
// @desc    Delete a gig
// @access  Private (Gig owner only)
router.delete('/:id', auth, authorizeRoles('freelancer'), async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Check if user owns the gig
    if (gig.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this gig' });
    }

    await gig.remove();

    res.json({ message: 'Gig deleted successfully' });
  } catch (error) {
    console.error('Delete gig error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gigs/my-gigs
// @desc    Get current user's gigs
// @access  Private (Freelancers only)
router.get('/my-gigs', auth, authorizeRoles('freelancer'), async (req, res) => {
  try {
    const gigs = await Gig.find({ freelancer: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ gigs });
  } catch (error) {
    console.error('Get my gigs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 