/**
 * User Activity Tracker
 * Tracks user online status, page views, and activity events
 * Sends data to backend for real-time monitoring
 */

const ACTIVITY_TRACKER_CONFIG = {
    HEARTBEAT_INTERVAL: 30000, // 30 seconds - send activity ping
    ONLINE_THRESHOLD: 120000,  // 2 minutes - user is "online"
    API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : '/api',
    ENABLED: false // Disable activity tracking if API endpoints don't exist
};

class UserActivityTracker {
    constructor() {
        this.sessionId = null;
        this.userId = null;
        this.userEmail = null;
        this.heartbeatTimer = null;
        this.pageStartTime = Date.now();
        this.currentPage = window.location.pathname;
    }

    /**
     * Initialize tracking for logged-in user
     */
    async init() {
        // Check if activity tracking is enabled
        if (!ACTIVITY_TRACKER_CONFIG.ENABLED) {
            // Activity tracking disabled - skip silently
            return;
        }

        // Get user info from localStorage
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
            console.log('User not logged in - activity tracking disabled');
            return;
        }

        try {
            const user = JSON.parse(userStr);
            this.userId = user.id;
            this.userEmail = user.email;

            // Start new session
            await this.startSession();

            // Start heartbeat
            this.startHeartbeat();

            // Track page changes
            this.trackPageActivity();

            // Setup cleanup on page unload
            this.setupBeforeUnload();

            console.log('Activity tracker initialized for:', this.userEmail);
        } catch (error) {
            console.error('Failed to initialize activity tracker:', error);
        }
    }

    /**
     * Start new session
     */
    async startSession() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${ACTIVITY_TRACKER_CONFIG.API_BASE}/activity/session/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userAgent: navigator.userAgent,
                    deviceType: this.getDeviceType(),
                    browser: this.getBrowser(),
                    ipAddress: null // Server can get this
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.sessionId = data.sessionId;
                localStorage.setItem('activitySessionId', this.sessionId);
            }
        } catch (error) {
            console.error('Failed to start session:', error);
        }
    }

    /**
     * Start heartbeat to update activity
     */
    startHeartbeat() {
        // Initial heartbeat
        this.sendHeartbeat();

        // Set up recurring heartbeat
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat();
        }, ACTIVITY_TRACKER_CONFIG.HEARTBEAT_INTERVAL);
    }

    /**
     * Send heartbeat to update user's last activity
     */
    async sendHeartbeat() {
        if (!this.sessionId) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${ACTIVITY_TRACKER_CONFIG.API_BASE}/activity/heartbeat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    pageUrl: window.location.pathname,
                    pageTitle: document.title
                })
            });
        } catch (error) {
            console.error('Heartbeat failed:', error);
        }
    }

    /**
     * Track page-specific activity
     */
    trackPageActivity() {
        // Track page views
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logEvent('page_hidden');
            } else {
                this.logEvent('page_visible');
                this.sendHeartbeat();
            }
        });

        // Track user interactions (debounced)
        let interactionTimer;
        const trackInteraction = () => {
            clearTimeout(interactionTimer);
            interactionTimer = setTimeout(() => {
                this.sendHeartbeat();
            }, 5000);
        };

        ['click', 'scroll', 'keypress', 'mousemove'].forEach(event => {
            document.addEventListener(event, trackInteraction, { passive: true });
        });

        // Track page changes in SPA
        let lastPath = window.location.pathname;
        setInterval(() => {
            if (window.location.pathname !== lastPath) {
                this.logEvent('page_change', { from: lastPath, to: window.location.pathname });
                lastPath = window.location.pathname;
                this.currentPage = lastPath;
                this.sendHeartbeat();
            }
        }, 1000);
    }

    /**
     * Log activity event
     */
    async logEvent(eventType, eventData = {}) {
        if (!this.sessionId) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${ACTIVITY_TRACKER_CONFIG.API_BASE}/activity/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    eventType,
                    eventData
                })
            });
        } catch (error) {
            console.error('Failed to log event:', error);
        }
    }

    /**
     * Handle page unload
     */
    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });

        // Also end session on tab close
        window.addEventListener('pagehide', () => {
            this.endSession();
        });
    }

    /**
     * End session
     */
    endSession() {
        if (!this.sessionId) return;

        // Stop heartbeat
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }

        try {
            const token = localStorage.getItem('token');
            // Use sendBeacon for reliable delivery during page unload
            const data = JSON.stringify({
                sessionId: this.sessionId
            });
            
            navigator.sendBeacon(
                `${ACTIVITY_TRACKER_CONFIG.API_BASE}/activity/session/end`,
                new Blob([data], { type: 'application/json' })
            );
        } catch (error) {
            console.error('Failed to end session:', error);
        }
    }

    /**
     * Helper: Get device type
     */
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }

    /**
     * Helper: Get browser name
     */
    getBrowser() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Firefox') > -1) return 'Firefox';
        if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
        if (ua.indexOf('Trident') > -1) return 'IE';
        if (ua.indexOf('Edge') > -1) return 'Edge';
        if (ua.indexOf('Chrome') > -1) return 'Chrome';
        if (ua.indexOf('Safari') > -1) return 'Safari';
        return 'Unknown';
    }

    /**
     * Track specific events (cart, wishlist, search, etc.)
     */
    trackAddToCart(productId, productName, price) {
        this.logEvent('add_to_cart', { productId, productName, price });
    }

    trackAddToWishlist(productId, productName) {
        this.logEvent('add_to_wishlist', { productId, productName });
    }

    trackSearch(query, resultsCount) {
        this.logEvent('search', { query, resultsCount });
    }

    trackCheckout(cartTotal, itemCount) {
        this.logEvent('checkout', { cartTotal, itemCount });
    }

    trackPurchase(orderId, total) {
        this.logEvent('purchase', { orderId, total });
    }
}

// Initialize global tracker
const activityTracker = new UserActivityTracker();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    activityTracker.init();
});

// Export for use in other scripts
window.activityTracker = activityTracker;
