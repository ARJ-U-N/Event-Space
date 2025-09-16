
const Hall = require('../models/Hall');


const getHalls = async (req, res) => {
  try {
    const halls = await Hall.find({ isActive: true });
    
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


const getHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    
    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    res.json({
      success: true,
      data: hall
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const createHall = async (req, res) => {
  try {
    const hall = await Hall.create(req.body);

    res.status(201).json({
      success: true,
      data: hall
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const updateHall = async (req, res) => {
  try {
    const hall = await Hall.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    res.json({
      success: true,
      data: hall
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    res.json({
      success: true,
      message: 'Hall deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getHalls,
  getHall,
  createHall,
  updateHall,
  deleteHall
};
