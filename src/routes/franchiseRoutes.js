const express = require('express');
const router = express.Router();
const {
  createFranchise,
  getAllFranchises,
  updateFranchise,
  deleteFranchise
} = require('../controllers/franchiseController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createFranchise);
router.get('/', protect, getAllFranchises);
router.put('/:id', protect, updateFranchise);
router.delete('/:id', protect, deleteFranchise);

module.exports = router;
