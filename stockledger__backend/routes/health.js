'use strict';

const { Router } = require('express');

const router = Router();

// GET /api/health
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
