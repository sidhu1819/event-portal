const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { isAdmin } = require('../middleware/authMiddleware');

// Admin sends a notification
router.post('/send', isAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const notification = new Notification({ message });
    await notification.save();
    res.status(201).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
