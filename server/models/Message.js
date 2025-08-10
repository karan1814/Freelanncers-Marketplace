const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ order: 1, createdAt: 1 });
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ recipient: 1, isRead: 1 });

// Virtual for formatted message
messageSchema.virtual('formattedMessage').get(function() {
  if (this.messageType === 'file') {
    return `📎 ${this.attachments[0]?.fileName || 'File'}`;
  }
  if (this.messageType === 'image') {
    return '📷 Image';
  }
  return this.message;
});

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Static method to get conversation messages
messageSchema.statics.getConversation = async function(orderId, page = 1, limit = 50) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const messages = await this.find({ order: orderId })
    .populate('sender', 'username profile.firstName profile.lastName profile.avatar')
    .populate('recipient', 'username profile.firstName profile.lastName profile.avatar')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await this.countDocuments({ order: orderId });

  return {
    messages,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalMessages: total,
      hasNext: skip + messages.length < total,
      hasPrev: parseInt(page) > 1
    }
  };
};

module.exports = mongoose.model('Message', messageSchema); 