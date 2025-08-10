const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates
const emailTemplates = {
  welcome: (user) => ({
    subject: 'Welcome to FreelancerHub!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to FreelancerHub!</h2>
        <p>Hi ${user.profile?.firstName || user.username},</p>
        <p>Welcome to FreelancerHub! We're excited to have you join our community of talented freelancers and clients.</p>
        <p>Get started by:</p>
        <ul>
          ${user.role === 'freelancer' 
            ? '<li>Creating your first gig to showcase your skills</li><li>Setting up your profile with your expertise</li>'
            : '<li>Browsing available gigs to find the perfect freelancer</li><li>Placing your first order</li>'
          }
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The FreelancerHub Team</p>
      </div>
    `
  }),

  orderReceived: (order, freelancer) => ({
    subject: 'New Order Received!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Order Received!</h2>
        <p>Hi ${freelancer.profile?.firstName || freelancer.username},</p>
        <p>Congratulations! You've received a new order for your gig: <strong>${order.gig?.title}</strong></p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Amount:</strong> $${order.amount}</p>
          <p><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toLocaleDateString()}</p>
          <p><strong>Requirements:</strong> ${order.requirements}</p>
        </div>
        <p>Please review the order details and start working on the project. Don't forget to communicate with your client!</p>
        <p>Best regards,<br>The FreelancerHub Team</p>
      </div>
    `
  }),

  orderStatusUpdate: (order, user, status) => ({
    subject: `Order Status Updated: ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Order Status Updated</h2>
        <p>Hi ${user.profile?.firstName || user.username},</p>
        <p>Your order status has been updated to: <strong>${status}</strong></p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Gig:</strong> ${order.gig?.title}</p>
          <p><strong>Amount:</strong> $${order.amount}</p>
          <p><strong>New Status:</strong> ${status}</p>
        </div>
        <p>You can track your order progress in your dashboard.</p>
        <p>Best regards,<br>The FreelancerHub Team</p>
      </div>
    `
  }),

  paymentReceived: (payment, freelancer) => ({
    subject: 'Payment Received!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Payment Received!</h2>
        <p>Hi ${freelancer.profile?.firstName || freelancer.username},</p>
        <p>Great news! You've received a payment for your work.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Payment Details:</h3>
          <p><strong>Payment ID:</strong> ${payment._id}</p>
          <p><strong>Amount:</strong> $${payment.freelancerAmount}</p>
          <p><strong>Platform Fee:</strong> $${payment.platformFee}</p>
          <p><strong>Total Order Amount:</strong> $${payment.amount}</p>
        </div>
        <p>The payment has been released from escrow and is now available in your account.</p>
        <p>Best regards,<br>The FreelancerHub Team</p>
      </div>
    `
  }),

  newMessage: (message, recipient) => ({
    subject: 'New Message Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Message Received</h2>
        <p>Hi ${recipient.profile?.firstName || recipient.username},</p>
        <p>You have received a new message regarding your order.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${message.sender?.profile?.firstName || message.sender?.username}</p>
          <p><strong>Message:</strong> ${message.message}</p>
          <p><strong>Order ID:</strong> ${message.order}</p>
        </div>
        <p>Please log in to your dashboard to respond to this message.</p>
        <p>Best regards,<br>The FreelancerHub Team</p>
      </div>
    `
  }),

  orderCompleted: (order, client) => ({
    subject: 'Order Completed!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Order Completed!</h2>
        <p>Hi ${client.profile?.firstName || client.username},</p>
        <p>Your order has been completed successfully!</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Gig:</strong> ${order.gig?.title}</p>
          <p><strong>Amount:</strong> $${order.amount}</p>
          <p><strong>Completed Date:</strong> ${new Date(order.completedDate).toLocaleDateString()}</p>
        </div>
        <p>Please review the delivered work and consider leaving a rating for the freelancer.</p>
        <p>Best regards,<br>The FreelancerHub Team</p>
      </div>
    `
  }),

  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hi ${user.profile?.firstName || user.username},</p>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The FreelancerHub Team</p>
      </div>
    `
  }),

  gigApproved: (gig, freelancer) => ({
    subject: 'Your Gig Has Been Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Gig Approved!</h2>
        <p>Hi ${freelancer.profile?.firstName || freelancer.username},</p>
        <p>Great news! Your gig has been approved and is now live on our platform.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Gig Details:</h3>
          <p><strong>Title:</strong> ${gig.title}</p>
          <p><strong>Category:</strong> ${gig.category}</p>
          <p><strong>Price:</strong> $${gig.price}</p>
        </div>
        <p>Your gig is now visible to potential clients. Start promoting it to get your first orders!</p>
        <p>Best regards,<br>The FreelancerHub Team</p>
      </div>
    `
  }),

  gigRejected: (gig, freelancer, reason) => ({
    subject: 'Gig Review Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Gig Review Update</h2>
        <p>Hi ${freelancer.profile?.firstName || freelancer.username},</p>
        <p>We've reviewed your gig and it requires some modifications before it can be published.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Gig Details:</h3>
          <p><strong>Title:</strong> ${gig.title}</p>
          <p><strong>Category:</strong> ${gig.category}</p>
          <p><strong>Reason for Rejection:</strong> ${reason}</p>
        </div>
        <p>Please review the feedback and make the necessary changes. You can resubmit your gig once the issues are resolved.</p>
        <p>Best regards,<br>The FreelancerHub Team</p>
      </div>
    `
  })
};

// Email service functions
const emailService = {
  // Send welcome email
  sendWelcomeEmail: async (user) => {
    try {
      const template = emailTemplates.welcome(user);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: template.subject,
        html: template.html
      });
      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error('Welcome email error:', error);
    }
  },

  // Send order notification
  sendOrderNotification: async (order, freelancer) => {
    try {
      const template = emailTemplates.orderReceived(order, freelancer);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: freelancer.email,
        subject: template.subject,
        html: template.html
      });
      console.log(`Order notification sent to ${freelancer.email}`);
    } catch (error) {
      console.error('Order notification error:', error);
    }
  },

  // Send order status update
  sendOrderStatusUpdate: async (order, user, status) => {
    try {
      const template = emailTemplates.orderStatusUpdate(order, user, status);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: template.subject,
        html: template.html
      });
      console.log(`Order status update sent to ${user.email}`);
    } catch (error) {
      console.error('Order status update error:', error);
    }
  },

  // Send payment notification
  sendPaymentNotification: async (payment, freelancer) => {
    try {
      const template = emailTemplates.paymentReceived(payment, freelancer);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: freelancer.email,
        subject: template.subject,
        html: template.html
      });
      console.log(`Payment notification sent to ${freelancer.email}`);
    } catch (error) {
      console.error('Payment notification error:', error);
    }
  },

  // Send new message notification
  sendMessageNotification: async (message, recipient) => {
    try {
      const template = emailTemplates.newMessage(message, recipient);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: template.subject,
        html: template.html
      });
      console.log(`Message notification sent to ${recipient.email}`);
    } catch (error) {
      console.error('Message notification error:', error);
    }
  },

  // Send order completion notification
  sendOrderCompletionNotification: async (order, client) => {
    try {
      const template = emailTemplates.orderCompleted(order, client);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: client.email,
        subject: template.subject,
        html: template.html
      });
      console.log(`Order completion notification sent to ${client.email}`);
    } catch (error) {
      console.error('Order completion notification error:', error);
    }
  },

  // Send password reset email
  sendPasswordResetEmail: async (user, resetToken) => {
    try {
      const template = emailTemplates.passwordReset(user, resetToken);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: template.subject,
        html: template.html
      });
      console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('Password reset email error:', error);
    }
  },

  // Send gig approval notification
  sendGigApprovalNotification: async (gig, freelancer) => {
    try {
      const template = emailTemplates.gigApproved(gig, freelancer);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: freelancer.email,
        subject: template.subject,
        html: template.html
      });
      console.log(`Gig approval notification sent to ${freelancer.email}`);
    } catch (error) {
      console.error('Gig approval notification error:', error);
    }
  },

  // Send gig rejection notification
  sendGigRejectionNotification: async (gig, freelancer, reason) => {
    try {
      const template = emailTemplates.gigRejected(gig, freelancer, reason);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: freelancer.email,
        subject: template.subject,
        html: template.html
      });
      console.log(`Gig rejection notification sent to ${freelancer.email}`);
    } catch (error) {
      console.error('Gig rejection notification error:', error);
    }
  },

  // Generic email sender
  sendEmail: async (to, subject, html) => {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
      });
      console.log(`Email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }
};

module.exports = emailService; 