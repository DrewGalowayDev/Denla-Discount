const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET /api/activity/online
router.get('/online', (req, res) => {
    res.status(200).json({
        success: true,
        onlineCount: 1,
        timestamp: new Date().toISOString()
    });
});

// GET /api/activity/stats/daily
router.get('/stats/daily', async (req, res) => {
    try {
        const stats = await query(
            `SELECT DATE(created_at) AS date, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total 
             FROM orders 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
             GROUP BY DATE(created_at) 
             ORDER BY date ASC`
        );
        res.status(200).json({ success: true, stats: stats || [] });
    } catch (e) {
        res.status(200).json({ success: true, stats: [] });
    }
});

// GET /api/activity/stats/hourly
router.get('/stats/hourly', async (req, res) => {
    try {
        const stats = await query(
            `SELECT HOUR(created_at) AS hour, COUNT(*) AS count 
             FROM orders 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) 
             GROUP BY HOUR(created_at) 
             ORDER BY hour ASC`
        );
        res.status(200).json({ success: true, stats: stats || [] });
    } catch (e) {
        res.status(200).json({ success: true, stats: [] });
    }
});

module.exports = router;
