const bcrypt = require('bcryptjs'); // Add this import
const User = require('../models/User');

// Get all hall admins (include both active and inactive)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ 
      role: 'admin'
      // Remove isActive: true filter to show both active and inactive admins
    }).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new hall admin
const createHallAdmin = async (req, res) => {
  try {
    const { name, email, password, department, phone } = req.body;

    console.log('Creating admin with data:', { name, email, department, phone });

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user with hashed password
    const admin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword, // Use hashed password
      role: 'admin',
      department: department ? department.trim() : '',
      phone: phone ? phone.trim() : '',
      isActive: true // Ensure new admins are active by default
    });

    // Remove password from response
    const { password: _, ...adminData } = admin.toObject();

    console.log('Admin created successfully:', adminData);

    res.status(201).json({
      success: true,
      message: 'Hall admin created successfully',
      data: adminData
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update hall admin
const updateHallAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email, department, phone } = req.body;

    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (admin.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is not a hall admin'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase() !== admin.email.toLowerCase()) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: adminId } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      { 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        department: department ? department.trim() : '', 
        phone: phone ? phone.trim() : ''
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Hall admin updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Deactivate hall admin
const deactivateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (admin.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is not a hall admin'
      });
    }

    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      { isActive: false },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Hall admin deactivated successfully',
      data: updatedAdmin // Return updated admin data
    });
  } catch (error) {
    console.error('Error deactivating admin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reactivate hall admin
const reactivateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      { isActive: true },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Hall admin reactivated successfully',
      data: updatedAdmin // Return updated admin data
    });
  } catch (error) {
    console.error('Error reactivating admin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllAdmins,
  createHallAdmin,
  updateHallAdmin,
  deactivateAdmin,
  reactivateAdmin
};
