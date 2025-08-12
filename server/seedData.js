const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Gig = require('./models/Gig');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const Message = require('./models/Message');
const Dispute = require('./models/Dispute');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/freelancer-marketplace', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample data arrays
const freelancers = [
  {
    username: 'johnsmith',
    email: 'john.smith@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'John',
      lastName: 'Smith',
      bio: 'Experienced full-stack developer with 5+ years of experience in modern web technologies.',
      skills: ['Web Development', 'React', 'Node.js', 'MongoDB'],
      hourlyRate: 45,
      location: 'New York, USA'
    },
    isVerified: true
  },
  {
    username: 'sarahjohnson',
    email: 'sarah.johnson@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      bio: 'Creative graphic designer specializing in brand identity and user interface design.',
      skills: ['Graphic Design', 'UI/UX', 'Adobe Creative Suite', 'Branding'],
      hourlyRate: 35,
      location: 'Los Angeles, USA'
    },
    isVerified: true
  },
  {
    username: 'mikechen',
    email: 'mike.chen@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Mike',
      lastName: 'Chen',
      bio: 'Mobile app developer with expertise in cross-platform development and native iOS/Android.',
      skills: ['Mobile Development', 'React Native', 'iOS', 'Android'],
      hourlyRate: 50,
      location: 'San Francisco, USA'
    },
    isVerified: true
  },
  {
    username: 'emilydavis',
    email: 'emily.davis@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Emily',
      lastName: 'Davis',
      bio: 'Professional content writer with expertise in SEO and digital marketing content.',
      skills: ['Content Writing', 'SEO', 'Copywriting', 'Blog Writing'],
      hourlyRate: 25,
      location: 'Chicago, USA'
    },
    isVerified: true
  },
  {
    username: 'davidwilson',
    email: 'david.wilson@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'David',
      lastName: 'Wilson',
      bio: 'Video editor and motion graphics specialist with experience in commercial and creative projects.',
      skills: ['Video Editing', 'Motion Graphics', 'Adobe Premiere', 'After Effects'],
      hourlyRate: 40,
      location: 'Miami, USA'
    },
    isVerified: true
  },
  {
    username: 'lisabrown',
    email: 'lisa.brown@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Lisa',
      lastName: 'Brown',
      bio: 'Digital marketing expert specializing in social media campaigns and paid advertising.',
      skills: ['Digital Marketing', 'Social Media', 'Google Ads', 'Facebook Ads'],
      hourlyRate: 30,
      location: 'Seattle, USA'
    },
    isVerified: true
  },
  {
    username: 'alexrodriguez',
    email: 'alex.rodriguez@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Alex',
      lastName: 'Rodriguez',
      bio: 'Data scientist and analyst with expertise in Python, SQL, and machine learning algorithms.',
      skills: ['Data Analysis', 'Python', 'SQL', 'Machine Learning'],
      hourlyRate: 55,
      location: 'Austin, USA'
    },
    isVerified: true
  },
  {
    username: 'mariagarcia',
    email: 'maria.garcia@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Maria',
      lastName: 'Garcia',
      bio: 'Professional translator specializing in Spanish-English content localization.',
      skills: ['Translation', 'Spanish', 'English', 'Content Localization'],
      hourlyRate: 20,
      location: 'Houston, USA'
    },
    isVerified: true
  },
  {
    username: 'jameslee',
    email: 'james.lee@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'James',
      lastName: 'Lee',
      bio: '3D artist and game developer with experience in Unity and Blender.',
      skills: ['3D Modeling', 'Blender', 'Unity', 'Game Development'],
      hourlyRate: 45,
      location: 'Denver, USA'
    },
    isVerified: true
  },
  {
    username: 'rachelgreen',
    email: 'rachel.green@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Rachel',
      lastName: 'Green',
      bio: 'Professional voice-over artist and audio editor for podcasts and commercial projects.',
      skills: ['Voice Over', 'Audio Editing', 'Podcasting', 'Narration'],
      hourlyRate: 35,
      location: 'Nashville, USA'
    },
    isVerified: true
  },
  {
    username: 'oliverwright',
    email: 'oliver.wright@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Oliver',
      lastName: 'Wright',
      bio: 'DevOps engineer with expertise in cloud infrastructure and CI/CD pipelines.',
      skills: ['DevOps', 'AWS', 'Docker', 'Kubernetes'],
      hourlyRate: 60,
      location: 'Boston, USA'
    },
    isVerified: true
  },
  {
    username: 'chloemoore',
    email: 'chloe.moore@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Chloe',
      lastName: 'Moore',
      bio: 'UI/UX designer passionate about creating intuitive digital experiences.',
      skills: ['UI/UX', 'Figma', 'Sketch', 'Prototyping'],
      hourlyRate: 38,
      location: 'Portland, USA'
    },
    isVerified: true
  },
  {
    username: 'ethanmartin',
    email: 'ethan.martin@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Ethan',
      lastName: 'Martin',
      bio: 'Backend developer specializing in scalable APIs and microservices.',
      skills: ['Node.js', 'Express', 'MongoDB', 'Microservices'],
      hourlyRate: 48,
      location: 'Dallas, USA'
    },
    isVerified: true
  },
  {
    username: 'zoewalker',
    email: 'zoe.walker@email.com',
    password: 'password123',
    role: 'freelancer',
    profile: {
      firstName: 'Zoe',
      lastName: 'Walker',
      bio: 'Social media strategist with a knack for viral campaigns.',
      skills: ['Social Media', 'Content Creation', 'Analytics', 'Influencer Marketing'],
      hourlyRate: 32,
      location: 'Atlanta, USA'
    },
    isVerified: true
  },
];

const clients = [
  {
    username: 'roberttaylor',
    email: 'robert.taylor@email.com',
    password: 'password123',
    role: 'client',
    profile: {
      firstName: 'Robert',
      lastName: 'Taylor'
    },
    isVerified: true
  },
  {
    username: 'jenniferwhite',
    email: 'jennifer.white@email.com',
    password: 'password123',
    role: 'client',
    profile: {
      firstName: 'Jennifer',
      lastName: 'White'
    },
    isVerified: true
  },
  {
    username: 'michaelanderson',
    email: 'michael.anderson@email.com',
    password: 'password123',
    role: 'client',
    profile: {
      firstName: 'Michael',
      lastName: 'Anderson'
    },
    isVerified: true
  },
  {
    username: 'amandamartinez',
    email: 'amanda.martinez@email.com',
    password: 'password123',
    role: 'client',
    profile: {
      firstName: 'Amanda',
      lastName: 'Martinez'
    },
    isVerified: true
  },
  {
    username: 'christopherthompson',
    email: 'christopher.thompson@email.com',
    password: 'password123',
    role: 'client',
    profile: {
      firstName: 'Christopher',
      lastName: 'Thompson'
    },
    isVerified: true
  },
  {
    username: 'jessicalewis',
    email: 'jessica.lewis@email.com',
    password: 'password123',
    role: 'client',
    profile: {
      firstName: 'Jessica',
      lastName: 'Lewis'
    },
    isVerified: true
  },
  {
    username: 'danielclark',
    email: 'daniel.clark@email.com',
    password: 'password123',
    role: 'client',
    profile: {
      firstName: 'Daniel',
      lastName: 'Clark'
    },
    isVerified: true
  },
  {
    username: 'nicolehall',
    email: 'nicole.hall@email.com',
    password: 'password123',
    role: 'client',
    profile: {
      firstName: 'Nicole',
      lastName: 'Hall'
    },
    isVerified: true
  },
  {
    username: 'kevinyoung',
    email: 'kevin.young@email.com',
    password: 'password123',
    role: 'client',
    profile: {
      firstName: 'Kevin',
      lastName: 'Young'
    },
    isVerified: true
  },
  {
    username: 'stephanieking',
    email: 'stephanie.king@email.com',
    password: 'password123',
    role: 'client',
    profile: {
      firstName: 'Stephanie',
      lastName: 'King'
    },
    isVerified: true
  }
];

const gigs = [
  {
    title: 'Professional Website Development',
    description: 'I will create a modern, responsive website using React and Node.js. Includes SEO optimization, mobile-friendly design, and content management system.',
    category: 'programming-tech',
    subcategory: 'Web Development',
    price: 500,
    deliveryTime: 7,
    revisions: 3,
    features: [
      { name: 'Responsive Design', included: true },
      { name: 'SEO Optimization', included: true },
      { name: 'Content Management System', included: true },
      { name: 'Mobile Friendly', included: true },
      { name: 'Fast Loading Speed', included: true }
    ],
    tags: ['react', 'nodejs', 'website', 'responsive', 'seo']
  },
  {
    title: 'Logo Design & Brand Identity',
    description: 'Professional logo design with complete brand identity package. Includes logo variations, color palette, typography, and brand guidelines.',
    category: 'design',
    subcategory: 'Logo Design',
    price: 150,
    deliveryTime: 3,
    revisions: 5,
    features: [
      { name: '3 Logo Variations', included: true },
      { name: 'Color Palette', included: true },
      { name: 'Typography Guide', included: true },
      { name: 'Brand Guidelines', included: true },
      { name: 'Source Files', included: true }
    ],
    tags: ['logo', 'branding', 'identity', 'design', 'professional']
  },
  {
    title: 'Mobile App Development',
    description: 'Cross-platform mobile app development using React Native. Includes user authentication, database integration, and app store deployment.',
    category: 'mobile-development',
    subcategory: 'Mobile Development',
    price: 800,
    deliveryTime: 14,
    revisions: 2,
    features: [
      { name: 'Cross-platform (iOS & Android)', included: true },
      { name: 'User Authentication', included: true },
      { name: 'Database Integration', included: true },
      { name: 'Push Notifications', included: true },
      { name: 'App Store Deployment', included: true }
    ],
    tags: ['react-native', 'mobile', 'app', 'ios', 'android']
  },
  {
    title: 'Content Writing & SEO',
    description: 'High-quality content writing optimized for SEO. Includes keyword research, meta descriptions, and content strategy.',
    category: 'writing',
    subcategory: 'Content Writing',
    price: 100,
    deliveryTime: 2,
    revisions: 3,
    features: [
      { name: 'SEO Optimized Content', included: true },
      { name: 'Keyword Research', included: true },
      { name: 'Meta Descriptions', included: true },
      { name: 'Content Strategy', included: true },
      { name: 'Plagiarism Free', included: true }
    ],
    tags: ['content', 'seo', 'writing', 'blog', 'articles']
  },
  {
    title: 'Video Editing & Motion Graphics',
    description: 'Professional video editing with motion graphics and visual effects. Perfect for commercials, social media, and promotional videos.',
    category: 'video-animation',
    subcategory: 'Video Editing',
    price: 300,
    deliveryTime: 5,
    revisions: 3,
    features: [
      { name: 'Professional Editing', included: true },
      { name: 'Motion Graphics', included: true },
      { name: 'Color Grading', included: true },
      { name: 'Sound Design', included: true },
      { name: 'Multiple Formats', included: true }
    ],
    tags: ['video', 'editing', 'motion-graphics', 'commercial', 'social-media']
  },
  {
    title: 'Digital Marketing Campaign',
    description: 'Complete digital marketing campaign including social media management, Google Ads, and content creation.',
    category: 'marketing',
    subcategory: 'Social Media Marketing',
    price: 400,
    deliveryTime: 10,
    revisions: 2,
    features: [
      { name: 'Social Media Management', included: true },
      { name: 'Google Ads Setup', included: true },
      { name: 'Content Creation', included: true },
      { name: 'Analytics Reports', included: true },
      { name: 'Performance Tracking', included: true }
    ],
    tags: ['marketing', 'social-media', 'ads', 'campaign', 'analytics']
  },
  {
    title: 'Data Analysis & Visualization',
    description: 'Comprehensive data analysis with interactive visualizations using Python and Tableau. Includes insights and recommendations.',
    category: 'programming-tech',
    subcategory: 'Data Analysis',
    price: 600,
    deliveryTime: 8,
    revisions: 2,
    features: [
      { name: 'Data Cleaning & Processing', included: true },
      { name: 'Statistical Analysis', included: true },
      { name: 'Interactive Visualizations', included: true },
      { name: 'Insights Report', included: true },
      { name: 'Recommendations', included: true }
    ],
    tags: ['data', 'analysis', 'python', 'visualization', 'insights']
  },
  {
    title: 'Translation Services',
    description: 'Professional translation services from English to Spanish. Specializing in business documents, websites, and marketing materials.',
    category: 'writing',
    subcategory: 'Translation',
    price: 80,
    deliveryTime: 3,
    revisions: 2,
    features: [
      { name: 'Professional Translation', included: true },
      { name: 'Cultural Adaptation', included: true },
      { name: 'Quality Assurance', included: true },
      { name: 'Fast Delivery', included: true },
      { name: 'Confidentiality', included: true }
    ],
    tags: ['translation', 'spanish', 'english', 'business', 'professional']
  },
  {
    title: '3D Modeling & Animation',
    description: 'High-quality 3D modeling and animation services. Perfect for product visualization, architectural renders, and game assets.',
    category: 'video-animation',
    subcategory: '3D Modeling',
    price: 350,
    deliveryTime: 7,
    revisions: 3,
    features: [
      { name: 'High-Quality 3D Models', included: true },
      { name: 'Texturing & Materials', included: true },
      { name: 'Lighting & Rendering', included: true },
      { name: 'Animation', included: true },
      { name: 'Multiple Formats', included: true }
    ],
    tags: ['3d', 'modeling', 'animation', 'rendering', 'visualization']
  },
  {
    title: 'Voice Over & Audio Production',
    description: 'Professional voice-over services with audio editing and production. Perfect for commercials, podcasts, and e-learning content.',
    category: 'music-audio',
    subcategory: 'Voice Over',
    price: 120,
    deliveryTime: 2,
    revisions: 2,
    features: [
      { name: 'Professional Voice Over', included: true },
      { name: 'Audio Editing', included: true },
      { name: 'Multiple Takes', included: true },
      { name: 'Background Music', included: true },
      { name: 'High Quality Audio', included: true }
    ],
    tags: ['voice-over', 'audio', 'podcast', 'commercial', 'professional']
  }
];

const orders = [
  {
    status: 'completed',
    amount: 500,
    requirements: 'Need a modern e-commerce website with payment integration and admin panel.',
    deliveryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    rating: 5,
    review: 'Excellent work! The website looks professional and functions perfectly. Highly recommended!'
  },
  {
    status: 'in-progress',
    amount: 150,
    requirements: 'Logo design for a tech startup. Need something modern and minimalist.',
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  },
  {
    status: 'pending',
    amount: 800,
    requirements: 'Mobile app for food delivery service with real-time tracking.',
    deliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  },
  {
    status: 'completed',
    amount: 100,
    requirements: 'Blog content about digital marketing trends for 2024.',
    deliveryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    rating: 4,
    review: 'Great content! Well-researched and engaging. Will order again.'
  },
  {
    status: 'in-progress',
    amount: 300,
    requirements: 'Video editing for product launch campaign. Need professional quality.',
    deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  }
];

const payments = [
  {
    status: 'completed',
    amount: 500,
    platformFee: 50,
    freelancerAmount: 450,
    paymentMethod: 'stripe',
    transactionId: 'txn_1234567890'
  },
  {
    status: 'completed',
    amount: 150,
    platformFee: 15,
    freelancerAmount: 135,
    paymentMethod: 'stripe',
    transactionId: 'txn_1234567891'
  },
  {
    status: 'pending',
    amount: 800,
    platformFee: 80,
    freelancerAmount: 720,
    paymentMethod: 'stripe',
    transactionId: 'txn_1234567892'
  },
  {
    status: 'completed',
    amount: 100,
    platformFee: 10,
    freelancerAmount: 90,
    paymentMethod: 'stripe',
    transactionId: 'txn_1234567893'
  },
  {
    status: 'processing',
    amount: 300,
    platformFee: 30,
    freelancerAmount: 270,
    paymentMethod: 'stripe',
    transactionId: 'txn_1234567894'
  }
];

const messages = [
  {
    message: 'Hi! I have some questions about the project requirements.',
    messageType: 'text',
    isRead: true
  },
  {
    message: 'Sure! I\'d be happy to help. What would you like to know?',
    messageType: 'text',
    isRead: true
  },
  {
    message: 'Can you show me some examples of your previous work?',
    messageType: 'text',
    isRead: false
  },
  {
    message: 'I\'ve attached some samples to the project files.',
    messageType: 'file',
    isRead: false
  }
];

const disputes = [
  {
    type: 'quality',
    reason: 'The delivered work does not match the agreed specifications.',
    status: 'open',
    resolution: null
  },
  {
    type: 'delivery',
    reason: 'Project is significantly delayed without proper communication.',
    status: 'under_review',
    resolution: null
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting to seed data...');

    // Clear existing data
    await User.deleteMany({});
    await Gig.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Message.deleteMany({});
    await Dispute.deleteMany({});

    console.log('🗑️ Cleared existing data');

    // Create users
    const createdUsers = [];
    
    // Create freelancers
    for (const freelancer of freelancers) {
      const user = new User({
        ...freelancer,
        rating: {
          average: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
          count: Math.floor(Math.random() * 50) + 10
        }
      });
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Created freelancer: ${freelancer.profile.firstName} ${freelancer.profile.lastName}`);
    }

    // Create clients
    for (const client of clients) {
      const user = new User(client);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Created client: ${client.profile.firstName} ${client.profile.lastName}`);
    }

    // Create gigs
    const createdGigs = [];
    for (let i = 0; i < gigs.length; i++) {
      const gig = new Gig({
        ...gigs[i],
        freelancer: createdUsers[i]._id,
        isActive: true,
        views: Math.floor(Math.random() * 1000) + 100,
        orders: Math.floor(Math.random() * 50) + 5,
        rating: {
          average: (Math.random() * 2 + 3).toFixed(1),
          count: Math.floor(Math.random() * 30) + 5
        },
        images: [
          { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500', alt: 'Website Development', isMain: true },
          { url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=500', alt: 'Coding Workspace', isMain: false }
        ]
      });
      const savedGig = await gig.save();
      createdGigs.push(savedGig);
      console.log(`✅ Created gig: ${gigs[i].title}`);
    }

    // Create orders
    const createdOrders = [];
    for (let i = 0; i < orders.length; i++) {
      const order = new Order({
        ...orders[i],
        gig: createdGigs[i]._id,
        client: createdUsers[freelancers.length + i]._id,
        freelancer: createdUsers[i]._id
      });
      const savedOrder = await order.save();
      createdOrders.push(savedOrder);
      console.log(`✅ Created order: ${orders[i].status}`);
    }

    // Create payments
    for (let i = 0; i < payments.length; i++) {
      const payment = new Payment({
        ...payments[i],
        order: createdOrders[i]._id,
        client: createdUsers[freelancers.length + i]._id,
        freelancer: createdUsers[i]._id
      });
      await payment.save();
      console.log(`✅ Created payment: ${payments[i].status}`);
    }

    // Create messages
    for (let i = 0; i < messages.length; i++) {
      const message = new Message({
        ...messages[i],
        order: createdOrders[0]._id,
        sender: i % 2 === 0 ? createdUsers[0]._id : createdUsers[freelancers.length]._id,
        recipient: i % 2 === 0 ? createdUsers[freelancers.length]._id : createdUsers[0]._id
      });
      await message.save();
      console.log(`✅ Created message: ${messages[i].messageType}`);
    }

    // Create disputes
    for (let i = 0; i < disputes.length; i++) {
      const dispute = new Dispute({
        ...disputes[i],
        order: createdOrders[i]._id,
        initiator: createdUsers[freelancers.length + i]._id,
        respondent: createdUsers[i]._id
      });
      await dispute.save();
      console.log(`✅ Created dispute: ${disputes[i].type}`);
    }

    console.log('\n🎉 Data seeding completed successfully!');
    console.log('\n📋 Test Account Credentials:');
    console.log('=====================================');
    
    // Display test accounts
    console.log('\n👨‍💻 Freelancer Accounts:');
    freelancers.forEach((freelancer, index) => {
      console.log(`${index + 1}. ${freelancer.profile.firstName} ${freelancer.profile.lastName}`);
      console.log(`   Username: ${freelancer.username}`);
      console.log(`   Email: ${freelancer.email}`);
      console.log(`   Password: ${freelancer.password}`);
      console.log(`   Skills: ${freelancer.profile.skills.join(', ')}`);
      console.log('');
    });

    console.log('\n👤 Client Accounts:');
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.profile.firstName} ${client.profile.lastName}`);
      console.log(`   Username: ${client.username}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Password: ${client.password}`);
      console.log('');
    });

    console.log('\n🔑 Quick Login Credentials:');
    console.log('=====================================');
    console.log('Freelancer: john.smith@email.com / password123');
    console.log('Client: robert.taylor@email.com / password123');
    console.log('\n🌐 Access your marketplace at: http://localhost:3000');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed function
seedData();
