const Hall = require('../models/Hall');
const Booking = require('../models/Booking');
const moment = require('moment');

// Get admin dashboard data (only their halls' requests)
const getAdminDashboard = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get halls created by this admin
    const myHalls = await Hall.find({ createdBy: adminId, isActive: true });
    const myHallIds = myHalls.map(hall => hall._id);

    if (myHallIds.length === 0) {
      return res.json({
        success: true,
        data: {
          statistics: {
            totalHalls: 0,
            pendingRequests: 0,
            approvedBookings: 0,
            rejectedRequests: 0
          },
          recentRequests: [],
          todayBookings: [],
          myHalls: []
        }
      });
    }

    // Get booking statistics for admin's halls ONLY
    const totalRequests = await Booking.countDocuments({
      hall: { $in: myHallIds }
    });

    const pendingRequests = await Booking.countDocuments({
      hall: { $in: myHallIds },
      status: 'PENDING'
    });

    const approvedBookings = await Booking.countDocuments({
      hall: { $in: myHallIds },
      status: 'APPROVED'
    });

    const rejectedRequests = await Booking.countDocuments({
      hall: { $in: myHallIds },
      status: 'REJECTED'
    });

    // Get recent requests for admin's halls
    const recentRequests = await Booking.find({
      hall: { $in: myHallIds }
    })
      .populate('hall', 'name number location')
      .populate('requestedBy', 'name email department')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get today's approved bookings
    const todayBookings = await Booking.find({
      hall: { $in: myHallIds },
      eventDate: {
        $gte: moment().startOf('day').toDate(),
        $lte: moment().endOf('day').toDate()
      },
      status: 'APPROVED'
    })
      .populate('hall', 'name number')
      .populate('requestedBy', 'name')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: {
        statistics: {
          totalHalls: myHalls.length,
          totalRequests,
          pendingRequests,
          approvedBookings,
          rejectedRequests
        },
        recentRequests,
        todayBookings,
        myHalls
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get pending requests for admin's halls
const getPendingRequests = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get halls created by this admin
    const myHalls = await Hall.find({ createdBy: adminId, isActive: true });
    const myHallIds = myHalls.map(hall => hall._id);

    const pendingRequests = await Booking.find({
      hall: { $in: myHallIds },
      status: 'PENDING'
    })
      .populate('hall', 'name number location capacity')
      .populate('requestedBy', 'name email department phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingRequests.length,
      data: pendingRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Approve or reject booking request
const respondToBookingRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { bookingId } = req.params;
    const { action, rejectionReason, adminNotes } = req.body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('hall', 'name number location createdBy')
      .populate('requestedBy', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found'
      });
    }

    // Check if admin owns this hall
    if (booking.hall.createdBy.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this hall'
      });
    }

    // Check if already responded
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // If approving, check for conflicts with other approved bookings
    if (action === 'approve') {
      const conflictingBooking = await Booking.findOne({
        hall: booking.hall._id,
        _id: { $ne: bookingId }, // Exclude current booking
        eventDate: {
          $gte: moment(booking.eventDate).startOf('day').toDate(),
          $lte: moment(booking.eventDate).endOf('day').toDate()
        },
        status: 'APPROVED',
        $or: [
          {
            startTime: { $lt: booking.endTime },
            endTime: { $gt: booking.startTime }
          }
        ]
      });

      if (conflictingBooking) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve: Time slot conflicts with another approved booking (${conflictingBooking.startTime} - ${conflictingBooking.endTime})`
        });
      }
    }

    // Update booking status
    booking.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    booking.respondedBy = adminId;
    booking.responseDate = new Date();

    if (action === 'reject') {
      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required when rejecting a request'
        });
      }
      booking.rejectionReason = rejectionReason;
    }

    if (adminNotes) {
      booking.adminNotes = adminNotes;
    }

    await booking.save();

    // Populate the updated booking
    await booking.populate('respondedBy', 'name email');

    res.json({
      success: true,
      message: `Booking request ${action}d successfully`,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new hall (admin functionality)
const createHall = async (req, res) => {
  try {
    const adminId = req.user.id;

    const hallData = {
      ...req.body,
      createdBy: adminId
    };

    const hall = await Hall.create(hallData);

    const populatedHall = await Hall.findById(hall._id)
      .populate('createdBy', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Hall created successfully',
      data: populatedHall
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Hall number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get admin's halls
const getMyHalls = async (req, res) => {
  try {
    const adminId = req.user.id;

    const halls = await Hall.find({
      createdBy: adminId,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: halls.length,
      data: halls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update hall (only for halls created by this admin)
const updateHall = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { hallId } = req.params;

    const hall = await Hall.findById(hallId);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    // Check if admin created this hall
    if (hall.createdBy.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this hall'
      });
    }

    const updatedHall = await Hall.findByIdAndUpdate(hallId, req.body, {
      new: true,
      runValidators: true
    }).populate('createdBy', 'name email department');

    res.json({
      success: true,
      message: 'Hall updated successfully',
      data: updatedHall
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all requests for admin's halls (with filters)
const getAllMyHallRequests = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { status, hallId, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Get halls created by this admin
    const myHalls = await Hall.find({ createdBy: adminId, isActive: true });
    const myHallIds = myHalls.map(hall => hall._id);

    if (myHallIds.length === 0) {
      return res.json({
        success: true,
        data: {
          bookings: [],
          pagination: { totalPages: 0, currentPage: 1, totalBookings: 0 }
        }
      });
    }

    // Build filter
    const filter = {
      hall: { $in: myHallIds }
    };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (hallId && myHallIds.map(id => id.toString()).includes(hallId)) {
      filter.hall = hallId;
    }

    if (startDate || endDate) {
      filter.eventDate = {};
      if (startDate) filter.eventDate.$gte = new Date(startDate);
      if (endDate) filter.eventDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('hall', 'name number location capacity')
      .populate('requestedBy', 'name email department phone')
      .populate('respondedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookings = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalBookings / parseInt(limit));

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBookings,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        myHalls
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAdminDashboard,
  getPendingRequests,
  respondToBookingRequest,
  createHall,
  getMyHalls,
  updateHall,
  getAllMyHallRequests
};
