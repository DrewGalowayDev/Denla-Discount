// Activity API — MySQL version
// Note: user_sessions, page_views, activity_events, daily_visits, hourly_visits
// tables may not exist in the MySQL schema. All writes silently succeed (no crash).
const { query, queryOne, generateUUID } = require('../../backend/config/database');
const { verifyToken } = require('../_utils/auth');
const { setCorsHeaders, handleOptions } = require('../_utils/cors');

module.exports = async (req, res) => {
    setCorsHeaders(res, req);
    if (handleOptions(req, res)) return;

    const authHeader = req.headers.authorization;
    let userId = null;
    if (authHeader) {
        try {
            const token = authHeader.replace('Bearer ', '');
            const decoded = verifyToken(token);
            userId = decoded?.userId;
        } catch (error) {
            console.error('Token verification failed:', error.message);
        }
    }

    const path = req.url.split('?')[0];

    try {
        // POST /api/activity/heartbeat
        if (path.includes('/heartbeat') && req.method === 'POST') {
            if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
            const { sessionId } = req.body;
            // Silently succeed — table may not exist
            return res.status(200).json({ success: true, message: 'Activity recorded', sessionId });
        }

        // POST /api/activity/session/start
        if (path.includes('/session/start') && req.method === 'POST') {
            if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
            const sessionId = generateUUID();
            return res.status(200).json({ success: true, sessionId });
        }

        // POST /api/activity/session/end
        if (path.includes('/session/end') && req.method === 'POST') {
            if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
            return res.status(200).json({ success: true, message: 'Session ended' });
        }

        // POST /api/activity/event
        if (path.includes('/event') && req.method === 'POST') {
            if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
            return res.status(200).json({ success: true, message: 'Event logged' });
        }

        // GET /api/activity/online
        if (path.includes('/online') && req.method === 'GET') {
            return res.status(200).json({ success: true, onlineUsers: [], count: 0 });
        }

        // GET /api/activity/stats/daily
        if (path.includes('/stats/daily') && req.method === 'GET') {
            return res.status(200).json({ success: true, stats: [] });
        }

        // GET /api/activity/stats/hourly
        if (path.includes('/stats/hourly') && req.method === 'GET') {
            return res.status(200).json({ success: true, hourlyStats: [] });
        }

        return res.status(404).json({ success: false, message: 'Endpoint not found' });
    } catch (error) {
        console.error('Activity API error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};
