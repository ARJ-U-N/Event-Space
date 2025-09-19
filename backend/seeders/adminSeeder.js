const mongoose = require('mongoose');
const User = require('../models/User');
const Hall = require('../models/Hall');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Sample users to create
const seedUsers = [
  // Super Admin
  {
    name: 'System Super Admin',
    email: 'superadmin@nirmala.com',
    password: 'Super@123',
    role: 'superadmin',
    department: 'Administration',
    phone: '9876543210'
  },
  
  // Hall Admins
  {
    name: 'Arts College Admin',
    email: 'artsadmin@nirmala.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Arts College',
    phone: '9876543211'
  },
  {
    name: 'Science College Admin',
    email: 'scienceadmin@nirmala.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Science College',
    phone: '9876543212'
  },
  {
    name: 'Commerce College Admin',
    email: 'commerceadmin@nirmala.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Commerce College',
    phone: '9876543213'
  },
  {
    name: 'Engineering College Admin',
    email: 'engadmin@nirmala.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Engineering College',
    phone: '9876543214'
  },

  // Sample Teachers for testing
  {
    name: 'Test Teacher',
    email: 'teacher@nirmala.com',
    password: 'Teacher@123',
    role: 'teacher',
    department: 'Computer Science',
    phone: '9876543215'
  },
  {
    name: 'Demo Teacher',
    email: 'demo@nirmala.com',
    password: 'Demo@123',
    role: 'teacher',
    department: 'Mathematics',
    phone: '9876543216'
  }
];

// Sample halls to create (will be assigned to admins)
const sampleHalls = [
  // Arts College Halls
  {
    name: 'Main Auditorium',
    number: 'A001',
    location: 'Arts College, Main Block, Ground Floor',
    capacity: 500,
    features: ['AC', 'Premium'],
    amenities: {
      projector: true,
      microphone: true,
      speakers: true,
      wifi: true,
      whiteboard: false,
      ac: true
    },
    pricePerHour: 2000,
    operatingHours: {
      start: '07:00',
      end: '18:00'
    },
    assignedTo: 'artsadmin@nirmala.com'
  },
  {
    name: 'Seminar Hall - A',
    number: 'A002',
    location: 'Arts College, A-Block, First Floor',
    capacity: 200,
    features: ['AC', 'NON-AC'],
    amenities: {
      projector: true,
      microphone: true,
      speakers: true,
      wifi: true,
      whiteboard: true,
      ac: true
    },
    pricePerHour: 1000,
    operatingHours: {
      start: '07:00',
      end: '18:00'
    },
    assignedTo: 'artsadmin@nirmala.com'
  },

  // Science College Halls
  {
    name: 'Science Auditorium',
    number: 'S001',
    location: 'Science College, Main Block, Ground Floor',
    capacity: 400,
    features: ['AC', 'Premium'],
    amenities: {
      projector: true,
      microphone: true,
      speakers: true,
      wifi: true,
      whiteboard: true,
      ac: true
    },
    pricePerHour: 1800,
    operatingHours: {
      start: '07:00',
      end: '18:00'
    },
    assignedTo: 'scienceadmin@nirmala.com'
  },
  {
    name: 'Conference Hall - S',
    number: 'S002',
    location: 'Science College, B-Block, Second Floor',
    capacity: 150,
    features: ['AC'],
    amenities: {
      projector: true,
      microphone: false,
      speakers: true,
      wifi: true,
      whiteboard: true,
      ac: true
    },
    pricePerHour: 800,
    operatingHours: {
      start: '07:00',
      end: '18:00'
    },
    assignedTo: 'scienceadmin@nirmala.com'
  },

  // Commerce College Halls
  {
    name: 'Commerce Hall',
    number: 'C001',
    location: 'Commerce College, Main Building, First Floor',
    capacity: 250,
    features: ['AC', 'NON-AC'],
    amenities: {
      projector: true,
      microphone: true,
      speakers: false,
      wifi: true,
      whiteboard: true,
      ac: false
    },
    pricePerHour: 600,
    operatingHours: {
      start: '07:00',
      end: '18:00'
    },
    assignedTo: 'commerceadmin@nirmala.com'
  },

  // Engineering College Halls
  {
    name: 'Tech Auditorium',
    number: 'E001',
    location: 'Engineering College, Tech Block, Ground Floor',
    capacity: 600,
    features: ['AC', 'Premium'],
    amenities: {
      projector: true,
      microphone: true,
      speakers: true,
      wifi: true,
      whiteboard: false,
      ac: true
    },
    pricePerHour: 2500,
    operatingHours: {
      start: '07:00',
      end: '18:00'
    },
    assignedTo: 'engadmin@nirmala.com'
  },
  {
    name: 'Engineering Seminar Hall',
    number: 'E002',
    location: 'Engineering College, Block-A, Third Floor',
    capacity: 180,
    features: ['AC'],
    amenities: {
      projector: true,
      microphone: true,
      speakers: true,
      wifi: true,
      whiteboard: true,
      ac: true
    },
    pricePerHour: 1200,
    operatingHours: {
      start: '07:00',
      end: '18:00'
    },
    assignedTo: 'engadmin@nirmala.com'
  }
];

// Database connection function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for Seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Seed users function
const seedUsers = async () => {
  try {
    console.log('🌱 Starting User Seeding...\n');
    
    const createdUsers = [];

    for (const userData of seedUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        createdUsers.push(existingUser);
        continue;
      }

      // Create user
      const user = await User.create(userData);
      createdUsers.push(user);
      
      console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`);
    }

    console.log(`\n📊 User Seeding Summary: ${createdUsers.length} users processed\n`);
    return createdUsers;
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Seed halls function
const seedHalls = async (users) => {
  try {
    console.log('🏢 Starting Hall Seeding...\n');
    
    const createdHalls = [];

    for (const hallData of sampleHalls) {
      // Check if hall already exists
      const existingHall = await Hall.findOne({ number: hallData.number });
      
      if (existingHall) {
        console.log(`⚠️  Hall ${hallData.number} already exists, skipping...`);
        createdHalls.push(existingHall);
        continue;
      }

      // Find the admin user for this hall
      const assignedAdmin = users.find(user => user.email === hallData.assignedTo);
      
      if (!assignedAdmin) {
        console.log(`❌ Admin not found for hall ${hallData.number}, skipping...`);
        continue;
      }

      // Create hall with admin reference
      const { assignedTo, ...hallCreateData } = hallData;
      const hall = await Hall.create({
        ...hallCreateData,
        createdBy: assignedAdmin._id
      });

      createdHalls.push(hall);
      console.log(`✅ Created Hall: ${hall.name} (${hall.number}) → Managed by ${assignedAdmin.name}`);
    }

    console.log(`\n📊 Hall Seeding Summary: ${createdHalls.length} halls processed\n`);
    return createdHalls;
    
  } catch (error) {
    console.error('❌ Error seeding halls:', error);
    throw error;
  }
};

// Main seeding function
const runSeeder = async () => {
  try {
    console.log('🚀 Starting Complete Database Seeding Process...\n');
    console.log('=' .repeat(60));
    
    // Connect to database
    await connectDB();
    
    // Seed users first (admins and super admin)
    const users = await seedUsers();
    
    // Seed halls and assign to admins
    const halls = await seedHalls(users);
    
    console.log('=' .repeat(60));
    console.log('🎉 Database Seeding Completed Successfully!\n');
    
    // Display login credentials
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('=' .repeat(40));
    
    // Group users by role for display
    const superAdmins = users.filter(u => u.role === 'superadmin');
    const admins = users.filter(u => u.role === 'admin');
    const teachers = users.filter(u => u.role === 'teacher');
    
    if (superAdmins.length > 0) {
      console.log('\n👑 SUPER ADMIN:');
      superAdmins.forEach(user => {
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: Super@123`);
        console.log(`   🏛️  Department: ${user.department}\n`);
      });
    }
    
    if (admins.length > 0) {
      console.log('🏢 HALL ADMINS:');
      admins.forEach(user => {
        const adminHalls = halls.filter(hall => hall.createdBy.toString() === user._id.toString());
        console.log(`   👤 ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: Admin@123`);
        console.log(`   🏛️  Department: ${user.department}`);
        console.log(`   🏢 Manages: ${adminHalls.length} halls`);
        if (adminHalls.length > 0) {
          adminHalls.forEach(hall => {
            console.log(`      • ${hall.name} (${hall.number})`);
          });
        }
        console.log('');
      });
    }
    
    if (teachers.length > 0) {
      console.log('👨‍🏫 TEST TEACHERS:');
      teachers.forEach(user => {
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: ${user.email === 'teacher@nirmala.com' ? 'Teacher@123' : 'Demo@123'}`);
        console.log(`   🏛️  Department: ${user.department}\n`);
      });
    }
    
    console.log('📊 SEEDING STATISTICS:');
    console.log(`   • Total Users: ${users.length}`);
    console.log(`   • Total Halls: ${halls.length}`);
    console.log(`   • Super Admins: ${superAdmins.length}`);
    console.log(`   • Hall Admins: ${admins.length}`);
    console.log(`   • Test Teachers: ${teachers.length}`);
    
    console.log('\n🌐 API ENDPOINTS TO TEST:');
    console.log('   • POST /api/auth/login - Login with any user above');
    console.log('   • GET /api/teacher/halls - Browse halls (teacher role)');
    console.log('   • GET /api/admin/dashboard - Admin dashboard (admin role)');
    console.log('   • GET /api/superadmin/admins - Manage admins (superadmin role)');
    
    console.log('\n✨ Ready to test the admin panel system!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding Process Failed:', error);
    process.exit(1);
  }
};

// Clear database function (optional - use with caution)
const clearDatabase = async () => {
  try {
    console.log('🗑️  Clearing existing data...');
    
    await User.deleteMany({});
    await Hall.deleteMany({});
    
    console.log('✅ Database cleared successfully');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  // Check for --fresh flag to clear database first
  const args = process.argv.slice(2);
  const freshStart = args.includes('--fresh') || args.includes('-f');
  
  if (freshStart) {
    console.log('🔄 Fresh start requested - clearing database first...\n');
    connectDB().then(clearDatabase).then(runSeeder);
  } else {
    runSeeder();
  }
}

module.exports = { 
  runSeeder, 
  seedUsers, 
  seedHalls, 
  clearDatabase 
};
