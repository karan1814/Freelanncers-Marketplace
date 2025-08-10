# Freelancer Marketplace

A full-stack web application where users can sign up as either clients or freelancers. Freelancers can create, edit, and manage service gigs, while clients can browse gigs, view details, and place orders.

## 🚀 Features

### Authentication & User Management
- JWT-based authentication
- Role-based access control (Client/Freelancer)
- User registration and login
- Profile management

### For Freelancers
- Create, edit, and delete gigs
- Manage gig status (active/inactive)
- View orders and manage them
- Track gig performance (views, orders, ratings)
- Profile customization with skills and hourly rates

### For Clients
- Browse gigs with advanced search and filtering
- View gig details and freelancer profiles
- Place orders with custom requirements
- Track order status and communicate with freelancers
- Rate completed orders

### General Features
- Responsive design with Tailwind CSS
- Real-time search and filtering
- Pagination for gig listings
- Order management system
- Rating and review system
- Dashboard with analytics

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Tailwind CSS** - Styling
- **React Icons** - Icon library
- **Axios** - HTTP client

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd freelancer-marketplace
```

### 2. Install dependencies
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

### 3. Environment Setup

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/freelancer-marketplace
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
```

### 5. Run the application

#### Development mode (both frontend and backend)
```bash
# From the root directory
npm run dev
```

#### Run separately
```bash
# Start backend server
npm run server

# Start frontend (in a new terminal)
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
freelancer-marketplace/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── index.js        # Entry point
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── config.env          # Environment variables
│   ├── index.js            # Server entry point
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Gigs
- `GET /api/gigs` - Get all gigs (with filtering)
- `GET /api/gigs/:id` - Get gig by ID
- `POST /api/gigs` - Create new gig (freelancers only)
- `PUT /api/gigs/:id` - Update gig (owner only)
- `DELETE /api/gigs/:id` - Delete gig (owner only)
- `GET /api/gigs/my-gigs` - Get user's gigs (freelancers only)

### Orders
- `POST /api/orders` - Create new order (clients only)
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/messages` - Add message to order
- `POST /api/orders/:id/rating` - Rate order (clients only)

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/gigs` - Get user's gigs
- `GET /api/users/:id/reviews` - Get user's reviews
- `GET /api/users/search` - Search users

## 🎯 Usage Guide

### For Freelancers

1. **Register/Login**: Create an account as a freelancer
2. **Create Gigs**: Go to Dashboard → Gigs → Create New Gig
3. **Manage Orders**: View and manage incoming orders
4. **Track Performance**: Monitor views, orders, and ratings

### For Clients

1. **Register/Login**: Create an account as a client
2. **Browse Gigs**: Use search and filters to find services
3. **Place Orders**: Select a gig and provide requirements
4. **Track Orders**: Monitor order status and communicate with freelancers

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Role-based access control
- Protected API endpoints

## 🎨 UI/UX Features

- Responsive design for all devices
- Modern and clean interface
- Loading states and error handling
- Toast notifications
- Form validation with real-time feedback
- Smooth transitions and animations

## 🚀 Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please:

1. Check the existing issues
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🔮 Future Enhancements

- Real-time messaging system
- File upload functionality
- Payment integration (Stripe/PayPal)
- Advanced analytics dashboard
- Mobile app development
- Email notifications
- Dispute resolution system
- Advanced search with AI recommendations 