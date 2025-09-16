
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

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@nirmala.com',
      password: 'password123',
      role: 'admin',
      department: 'Administration'
    });

    // Create test teacher
    const teacherUser = await User.create({
      name: 'SWIPE',
      email: 'teacher@nirmala.com',
      password: 'password123',
      role: 'teacher',
      department: 'Computer Science'
    });

    // Create halls
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
          whiteboard: true
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
          whiteboard: true
        }
      }
    ]);

    console.log('Data seeded successfully');
    console.log('Admin:', adminUser.email, 'password123');
    console.log('Teacher:', teacherUser.email, 'password123');
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
