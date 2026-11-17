const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/health : liveness + database state. Always 200 while the process is up.
router.get('/', (req, res) => {
  const db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', db, uptime: Math.round(process.uptime()) });
});

module.exports = router;
