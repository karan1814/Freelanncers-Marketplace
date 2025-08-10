# FreelancerHub - Market-Ready Freelancer Marketplace

A comprehensive, production-ready freelancer marketplace platform with advanced features for modern business needs. Built with React, Node.js, and MongoDB, featuring real-time communication, secure payments, and advanced analytics.

## 🚀 **Market-Ready Features**

### **💳 Payment & Financial System**
- **Stripe Integration** - Secure payment processing with PCI compliance
- **Escrow System** - Funds held securely until order completion
- **Platform Fee Management** - Automated 10% platform fee calculation
- **Refund Processing** - Automated refund handling with dispute resolution
- **Payment History** - Complete transaction tracking and reporting
- **Multiple Payment Methods** - Support for cards, digital wallets, and bank transfers

### **💬 Real-Time Communication**
- **Socket.IO Integration** - Instant messaging between clients and freelancers
- **Order-Specific Chat Rooms** - Private communication channels
- **File Sharing** - Support for documents, images, and attachments
- **Typing Indicators** - Real-time user activity feedback
- **Message History** - Complete conversation archives
- **Read Receipts** - Message delivery and read status tracking

### **📁 Advanced File Management**
- **Cloudinary Integration** - Professional cloud storage and CDN
- **Image Optimization** - Automatic resizing and compression
- **Multiple File Types** - Support for images, documents, and archives
- **Avatar Management** - Profile picture handling with face detection
- **Gig Image Galleries** - Multiple images per gig with main image selection
- **Bulk Operations** - Mass upload and deletion capabilities

### **📧 Email Notification System**
- **Automated Notifications** - Order updates, payments, and system alerts
- **Professional Templates** - Branded email communications
- **Welcome Series** - Onboarding emails for new users
- **Order Status Updates** - Real-time order progress notifications
- **Payment Confirmations** - Transaction receipts and confirmations
- **Dispute Notifications** - Conflict resolution communications

### **⚖️ Dispute Resolution System**
- **Multi-Stage Resolution** - Open, under review, resolved, closed statuses
- **Evidence Management** - File uploads and screenshot support
- **Admin Arbitration** - Professional dispute handling
- **Resolution Types** - Full refund, partial refund, continue work, revision
- **Dispute Statistics** - Performance metrics and resolution times
- **Automated Actions** - Order status updates based on resolutions

### **📊 Advanced Analytics & Reporting**
- **Real-Time Metrics** - Live platform performance data
- **User Analytics** - Growth, engagement, and behavior tracking
- **Financial Reports** - Revenue, fees, and transaction analysis
- **Category Performance** - Service category insights and trends
- **Performance Metrics** - Completion rates, dispute rates, response times
- **Data Export** - CSV/JSON export for external analysis
- **Trend Analysis** - Historical data and growth patterns

### **🔒 Enhanced Security Features**
- **Rate Limiting** - Protection against abuse and DDoS attacks
- **Helmet.js** - Security headers and XSS protection
- **Input Validation** - Comprehensive data sanitization
- **CORS Configuration** - Secure cross-origin resource sharing
- **Compression** - Optimized data transfer and performance
- **Error Handling** - Graceful error management and logging

### **🎯 Core Platform Features**

#### **Authentication & User Management**
- JWT-based authentication with refresh tokens
- Role-based access control (Client/Freelancer/Admin)
- User verification system with email confirmation
- Profile management with skills and portfolio
- Password reset functionality
- Session management and security

#### **Gig Management System**
- **Advanced Gig Creation** - Rich text editor, image galleries, feature lists
- **Category Management** - 10+ service categories with subcategories
- **Pricing Models** - Fixed pricing with revision packages
- **Gig Analytics** - Views, orders, ratings, and performance tracking
- **Status Management** - Active/inactive gig control
- **SEO Optimization** - Search-friendly URLs and meta tags

#### **Order Processing**
- **Order Lifecycle** - Pending → In Progress → Completed/Cancelled
- **Revision System** - Configurable revision limits and tracking
- **Delivery Management** - Deadline tracking and overdue detection
- **Quality Assurance** - Rating and review system
- **Order History** - Complete transaction records

#### **Search & Discovery**
- **Advanced Search** - Text-based search with relevance scoring
- **Filtering System** - Category, price range, delivery time, rating
- **Sorting Options** - Price, rating, creation date, popularity
- **Pagination** - Efficient large dataset handling
- **Search Analytics** - Popular searches and trends

#### **Dashboard & Analytics**
- **User Dashboards** - Role-specific analytics and metrics
- **Performance Tracking** - Earnings, orders, ratings, views
- **Order Management** - Status tracking and communication
- **Financial Reports** - Revenue, fees, and payment history
- **Real-Time Updates** - Live data refresh and notifications

## 🛠️ **Tech Stack**

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework with middleware support
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.IO** - Real-time bidirectional communication
- **Stripe** - Payment processing and financial operations
- **Cloudinary** - Cloud storage and image management
- **Nodemailer** - Email service integration
- **JWT** - Stateless authentication
- **bcryptjs** - Password hashing and security
- **express-validator** - Input validation and sanitization
- **Helmet.js** - Security headers and protection
- **Rate Limiting** - API abuse prevention

### **Frontend**
- **React 18** - Modern UI library with hooks
- **React Router** - Client-side routing and navigation
- **React Query** - Data fetching, caching, and synchronization
- **React Hook Form** - Form management and validation
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Comprehensive icon library
- **Axios** - HTTP client with interceptors
- **Socket.IO Client** - Real-time communication
- **React Hot Toast** - User notification system

### **Infrastructure**
- **MongoDB Atlas** - Cloud database hosting
- **Cloudinary** - Cloud storage and CDN
- **Stripe** - Payment infrastructure
- **Email Service** - Transactional email delivery
- **Rate Limiting** - API protection and monitoring

## 📋 **Prerequisites**

- **Node.js** (v16 or higher)
- **MongoDB** (v5.0 or higher)
- **npm** or **yarn**
- **Stripe Account** - For payment processing
- **Cloudinary Account** - For file storage
- **Email Service** - For notifications

## 🚀 **Installation & Setup**

### **1. Clone the repository**
```bash
git clone <repository-url>
cd freelancer-marketplace
```

### **2. Install dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### **3. Environment Configuration**

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/freelancer-marketplace

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Security
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your_session_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/zip,application/x-rar-compressed
```

### **4. Start MongoDB**
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

### **5. Run the application**
```bash
# Development mode (both frontend and backend)
npm run dev

# Or run separately
npm run server  # Backend
npm run client  # Frontend
```

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### **Gigs**
- `GET /api/gigs` - Get all gigs with filtering
- `GET /api/gigs/:id` - Get gig by ID
- `POST /api/gigs` - Create new gig (freelancers only)
- `PUT /api/gigs/:id` - Update gig (owner only)
- `DELETE /api/gigs/:id` - Delete gig (owner only)
- `GET /api/gigs/my-gigs` - Get user's gigs
- `GET /api/gigs/popular` - Get popular gigs
- `GET /api/gigs/trending` - Get trending gigs

### **Orders**
- `POST /api/orders` - Create new order (clients only)
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/rating` - Rate completed order

### **Payments**
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/confirm-payment` - Confirm payment and escrow
- `POST /api/payments/release-escrow` - Release payment to freelancer
- `POST /api/payments/request-refund` - Request refund
- `GET /api/payments/my-payments` - Get payment history
- `GET /api/payments/:id` - Get payment details

### **Messaging**
- `POST /api/messages` - Send message
- `GET /api/messages/order/:orderId` - Get order messages
- `PUT /api/messages/:id/read` - Mark message as read
- `GET /api/messages/unread-count` - Get unread count
- `GET /api/messages/conversations` - Get user conversations
- `DELETE /api/messages/:id` - Delete message

### **File Upload**
- `POST /api/upload/image` - Upload image
- `POST /api/upload/avatar` - Upload user avatar
- `POST /api/upload/gig-images` - Upload gig images
- `POST /api/upload/document` - Upload document
- `DELETE /api/upload/:publicId` - Delete file
- `POST /api/upload/bulk-delete` - Bulk delete files

### **Disputes**
- `POST /api/disputes` - Create dispute
- `GET /api/disputes/my-disputes` - Get user disputes
- `GET /api/disputes/:id` - Get dispute details
- `POST /api/disputes/:id/messages` - Add dispute message
- `POST /api/disputes/:id/evidence` - Add evidence
- `PUT /api/disputes/:id/resolve` - Resolve dispute (admin)
- `GET /api/disputes/stats/overview` - Get dispute statistics
- `GET /api/disputes/admin/all` - Get all disputes (admin)

### **Analytics**
- `POST /api/analytics/generate` - Generate analytics (admin)
- `GET /api/analytics/overview` - Get analytics overview (admin)
- `GET /api/analytics/trends` - Get analytics trends (admin)
- `GET /api/analytics/categories` - Get category analytics (admin)
- `GET /api/analytics/users` - Get user analytics (admin)
- `GET /api/analytics/financial` - Get financial analytics (admin)
- `GET /api/analytics/performance` - Get performance metrics (admin)
- `GET /api/analytics/export` - Export analytics data (admin)

### **Users**
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/gigs` - Get user's gigs
- `GET /api/users/:id/reviews` - Get user's reviews
- `GET /api/users/search` - Search users

## 🎯 **Usage Guide**

### **For Freelancers**
1. **Register/Login** - Create account as freelancer
2. **Complete Profile** - Add skills, portfolio, and verification
3. **Create Gigs** - Build compelling service offerings
4. **Manage Orders** - Handle incoming orders and communication
5. **Track Performance** - Monitor earnings, ratings, and analytics
6. **Handle Disputes** - Resolve conflicts professionally

### **For Clients**
1. **Register/Login** - Create account as client
2. **Browse Services** - Search and filter available gigs
3. **Place Orders** - Select gigs and provide requirements
4. **Track Progress** - Monitor order status and communicate
5. **Make Payments** - Secure payment through Stripe
6. **Rate & Review** - Provide feedback on completed work

### **For Administrators**
1. **Platform Management** - Monitor overall platform health
2. **Dispute Resolution** - Handle conflicts and arbitrate disputes
3. **Analytics Review** - Analyze performance and trends
4. **User Management** - Oversee user accounts and verification
5. **Financial Oversight** - Monitor revenue and payment processing

## 🔒 **Security Features**

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt encryption for passwords
- **Input Validation** - Comprehensive data sanitization
- **Rate Limiting** - Protection against abuse and attacks
- **CORS Protection** - Secure cross-origin resource sharing
- **Helmet.js** - Security headers and XSS protection
- **File Upload Security** - Type and size validation
- **Payment Security** - PCI-compliant payment processing

## 🎨 **UI/UX Features**

- **Responsive Design** - Mobile-first approach
- **Modern Interface** - Clean, professional design
- **Real-Time Updates** - Live data synchronization
- **Loading States** - Smooth user experience
- **Error Handling** - Graceful error management
- **Accessibility** - WCAG compliance standards
- **Performance** - Optimized loading and rendering

## 🚀 **Deployment**

### **Backend Deployment**
1. Set up MongoDB Atlas database
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Set up SSL certificates and domain

### **Frontend Deployment**
1. Build the React app: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Configure environment variables
4. Set up custom domain and SSL

### **Production Checklist**
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL certificates installed
- [ ] Monitoring and logging set up
- [ ] Rate limiting configured
- [ ] Error tracking implemented
- [ ] Performance monitoring active

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For support and questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🔮 **Future Enhancements**

- **AI-Powered Matching** - Smart gig recommendations
- **Video Calls** - Built-in communication platform
- **Mobile App** - Native iOS and Android applications
- **Advanced Analytics** - Machine learning insights
- **Multi-Language Support** - Internationalization
- **Advanced Search** - AI-powered search algorithms
- **Subscription Models** - Premium features and memberships
- **API Marketplace** - Third-party integrations
- **Blockchain Integration** - Decentralized payments
- **VR/AR Support** - Immersive service experiences

---

**FreelancerHub** - Building the future of freelance work, one connection at a time. 