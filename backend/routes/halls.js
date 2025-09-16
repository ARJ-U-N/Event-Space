
const express = require('express');
const { body } = require('express-validator');
const {
  getHalls,
  getHall,
  createHall,
  updateHall,
  deleteHall
} = require('../controllers/hallController');
const { auth, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Hall validation
const hallValidation = [
  body('name')
    .notEmpty()
    .withMessage('Hall name is required')
    .isLength({ max: 100 })
    .withMessage('Hall name cannot exceed 100 characters'),
  body('number')
    .notEmpty()
    .withMessage('Hall number is required'),
  body('location')
    .notEmpty()
    .withMessage('Location is required'),
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive number')
];

router.route('/')
  .get(auth, getHalls)
  .post(auth, authorize('admin'), hallValidation, handleValidationErrors, createHall);

router.route('/:id')
  .get(auth, getHall)
  .put(auth, authorize('admin'), updateHall)
  .delete(auth, authorize('admin'), deleteHall);

module.exports = router;
