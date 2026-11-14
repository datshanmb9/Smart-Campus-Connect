const express = require('express');
const router = express.Router();
const {
  createItem,
  getAllItems,
  getMyItems,
  getItemById,
  claimItem,
  updateItemStatus,
  deleteItem,
} = require('../controllers/lostFoundController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', getAllItems);
router.get('/my', getMyItems);
router.get('/:id', getItemById);

router.post('/', upload.single('image'), createItem);
router.put('/:id/claim', claimItem);
router.put('/:id/status', updateItemStatus);
router.delete('/:id', deleteItem);

module.exports = router;

