const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['quality', 'delivery', 'communication', 'payment', 'other'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'closed'],
    default: 'open'
  },
  resolution: {
    type: String,
    enum: ['refund_full', 'refund_partial', 'continue_work', 'revision', 'cancelled'],
    default: null
  },
  adminNotes: {
    type: String,
    maxlength: 2000
  },
  evidence: [{
    type: {
      type: String,
      enum: ['message', 'file', 'screenshot', 'other']
    },
    description: String,
    fileUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
    isAdmin: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
disputeSchema.index({ order: 1 });
disputeSchema.index({ initiator: 1, status: 1 });
disputeSchema.index({ respondent: 1, status: 1 });
disputeSchema.index({ status: 1, createdAt: 1 });

// Virtual for dispute duration
disputeSchema.virtual('duration').get(function() {
  const endDate = this.resolvedAt || this.closedAt || new Date();
  return Math.ceil((endDate - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to add evidence
disputeSchema.methods.addEvidence = function(evidenceData, userId) {
  this.evidence.push({
    ...evidenceData,
    uploadedBy: userId
  });
  return this.save();
};

// Method to add message
disputeSchema.methods.addMessage = function(messageData, userId, isAdmin = false) {
  this.messages.push({
    ...messageData,
    sender: userId,
    isAdmin
  });
  return this.save();
};

// Method to resolve dispute
disputeSchema.methods.resolve = function(resolution, adminNotes = null) {
  this.status = 'resolved';
  this.resolution = resolution;
  this.adminNotes = adminNotes;
  this.resolvedAt = new Date();
  return this.save();
};

// Method to close dispute
disputeSchema.methods.close = function() {
  this.status = 'closed';
  this.closedAt = new Date();
  return this.save();
};

// Static method to get dispute statistics
disputeSchema.statics.getDisputeStats = async function(timeframe = '30d') {
  const dateFilter = {};
  if (timeframe === '7d') {
    dateFilter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  } else if (timeframe === '30d') {
    dateFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  } else if (timeframe === '90d') {
    dateFilter.createdAt = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
  }

  const stats = await this.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalDisputes: { $sum: 1 },
        openDisputes: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        resolvedDisputes: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        averageResolutionTime: {
          $avg: {
            $cond: [
              { $in: ['$status', ['resolved', 'closed']] },
              { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] },
              null
            ]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalDisputes: 0,
    openDisputes: 0,
    resolvedDisputes: 0,
    averageResolutionTime: 0
  };
};

module.exports = mongoose.model('Dispute', disputeSchema); 