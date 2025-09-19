const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Hall = require('../models/Hall');
const connectDB = require('../config/database');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Hall.deleteMany();

    console.log('🗑️  Cleared existing data');

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'System Super Admin',
      email: 'superadmin@nirmala.com',
      password: 'Super@123',
      role: 'superadmin',
      department: 'Administration',
      phone: '9876543210'
    });

    // Create Hall Admins
    const artsAdmin = await User.create({
      name: 'Arts College Admin',
      email: 'admin@nirmala.com', // Keep your existing admin email
      password: 'password123', // Keep your existing password
      role: 'admin',
      department: 'Arts College',
      phone: '9876543211'
    });

    const scienceAdmin = await User.create({
      name: 'Science College Admin',
      email: 'scienceadmin@nirmala.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'Science College',
      phone: '9876543212'
    });

    // Create Test Teacher (keep your existing one)
    const teacherUser = await User.create({
      name: 'SWIPE',
      email: 'teacher@nirmala.com',
      password: 'password123',
      role: 'teacher',
      department: 'Computer Science',
      phone: '9876543215'
    });

    // Create another test teacher
    const demoTeacher = await User.create({
      name: 'Demo Teacher',
      email: 'demo@nirmala.com',
      password: 'Demo@123',
      role: 'teacher',
      department: 'Mathematics',
      phone: '9876543216'
    });

    // Create halls with createdBy reference (REQUIRED for admin panel)
    const halls = await Hall.insertMany([
      {
        name: 'SEMINAR HALL',
        number: '01',
        location: 'Arts College, A-Block, Ground Floor',
        capacity: 200,
        features: ['AC', 'NON-AC'],
        amenities: {
          projector: true,
          microphone: true,
          speakers: true,
          wifi: true,
          whiteboard: true,
          ac: true // Added AC amenity
        },
        createdBy: artsAdmin._id, // IMPORTANT: Assign to Arts Admin
        pricePerHour: 1000,
        operatingHours: {
          start: '07:00',
          end: '18:00'
        }
      },
      {
        name: 'PHARMACY HALL',
        number: '02',
        location: 'Pharmacy College, First Floor',
        capacity: 200,
        features: ['AC', 'NON-AC'],
        amenities: {
          projector: true,
          microphone: true,
          speakers: true,
          wifi: false,
          whiteboard: true,
          ac: false // Added AC amenity
        },
        createdBy: artsAdmin._id, // IMPORTANT: Assign to Arts Admin
        pricePerHour: 800,
        operatingHours: {
          start: '07:00',
          end: '18:00'
        }
      },
      {
        name: 'SCIENCE AUDITORIUM',
        number: '03',
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
        createdBy: scienceAdmin._id, // IMPORTANT: Assign to Science Admin
        pricePerHour: 1500,
        operatingHours: {
          start: '07:00',
          end: '18:00'
        }
      },
      {
        name: 'CONFERENCE HALL - S',
        number: '04',
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
        createdBy: scienceAdmin._id, // IMPORTANT: Assign to Science Admin
        pricePerHour: 600,
        operatingHours: {
          start: '07:00',
          end: '18:00'
        }
      }
    ]);

    console.log('✅ Data seeded successfully\n');
    
    // Display login credentials
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('=' .repeat(50));
    
    console.log('\n👑 SUPER ADMIN:');
    console.log(`   📧 Email: ${superAdmin.email}`);
    console.log(`   🔑 Password: Super@123`);
    console.log(`   🎯 Role: superadmin`);
    
    console.log('\n🏢 HALL ADMINS:');
    console.log(`   👤 ${artsAdmin.name}`);
    console.log(`   📧 Email: ${artsAdmin.email}`);
    console.log(`   🔑 Password: password123`);
    console.log(`   🎯 Role: admin`);
    console.log(`   🏢 Manages: SEMINAR HALL, PHARMACY HALL\n`);
    
    console.log(`   👤 ${scienceAdmin.name}`);
    console.log(`   📧 Email: ${scienceAdmin.email}`);
    console.log(`   🔑 Password: Admin@123`);
    console.log(`   🎯 Role: admin`);
    console.log(`   🏢 Manages: SCIENCE AUDITORIUM, CONFERENCE HALL - S\n`);
    
    console.log('👨‍🏫 TEACHERS:');
    console.log(`   📧 Email: ${teacherUser.email}`);
    console.log(`   🔑 Password: password123`);
    console.log(`   🎯 Role: teacher\n`);
    
    console.log(`   📧 Email: ${demoTeacher.email}`);
    console.log(`   🔑 Password: Demo@123`);
    console.log(`   🎯 Role: teacher\n`);
    
    console.log('🌐 TEST ENDPOINTS:');
    console.log('   • POST /api/auth/login - Login with any user above');
    console.log('   • GET /api/teacher/halls - Browse halls (teacher role)');
    console.log('   • GET /api/admin/dashboard - Admin dashboard (admin role)');
    console.log('   • GET /api/superadmin/admins - Manage admins (superadmin role)');
    
    console.log('\n✨ Admin Panel System Ready!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
