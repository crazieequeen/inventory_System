const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Clear all users (for development only)
router.delete('/clear-users', async (req, res) => {
  try {
    await User.deleteMany({});
    res.json({
      success: true,
      message: 'All users deleted successfully'
    });
  } catch (error) {
    console.error('Error clearing users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear users'
    });
  }
});

module.exports = router;
