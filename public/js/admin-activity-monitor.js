/**
 * Admin Activity Monitor
 * Displays real-time user activity and wishlist data
 */

const ADMIN_MONITOR_CONFIG = {
    REFRESH_INTERVAL: 10000, // Refresh every 10 seconds
    BACKEND_BASE: window.location.origin
};

class AdminActivityMonitor {
    constructor() {
        this.refreshTimer = null;
        this.customers = [];
        this.onlineUsers = new Set();
        this.wishlistData = {};
    }

    /**
     * Initialize the monitor
     */
    async init() {
        console.log('Initializing Admin Activity Monitor...');
        
        // Load initial data
        await this.loadAllData();
        
        // Load activity statistics
        await Promise.all([
            this.loadDailyStats(),
            this.loadHourlyStats()
        ]);
        
        // Start auto-refresh
        this.startAutoRefresh();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Load all customer and activity data
     */
    async loadAllData() {
        try {
            await Promise.all([
                this.loadCustomers(),
                this.loadOnlineUsers(),
                this.loadWishlistData()
            ]);
            
            this.renderCustomersTable();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    /**
     * Load customers from backend
     */
    async loadCustomers() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${ADMIN_MONITOR_CONFIG.BACKEND_BASE}/api/admin/customers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const result = await response.json();
                const customers = result.customers || result.data || result || [];
                this.customers = Array.isArray(customers) ? customers : [];
            } else {
                // Use mock data if backend not available
                this.customers = this.getMockCustomers();
            }
        } catch (error) {
            console.warn('Using mock customer data:', error.message);
            this.customers = this.getMockCustomers();
        }
    }

    /**
     * Load online users activity (NEW API)
     */
    async loadOnlineUsers() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${ADMIN_MONITOR_CONFIG.BACKEND_BASE}/api/activity/online`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const result = await response.json();
                const data = result.onlineUsers || result.data || result || [];
                this.onlineUsers = new Set(Array.isArray(data) ? data.map(u => u.userId || u.user_id || u.email) : []);
                
                // Update dashboard stats
                this.updateOnlineUsersCount(this.onlineUsers.size);
            } else {
                // Fallback to old API
                await this.loadOnlineUsersOldAPI();
            }
        } catch (error) {
            console.warn('Loading online users from fallback API:', error.message);
            await this.loadOnlineUsersOldAPI();
        }
    }

    /**
     * Load online users from old API (fallback)
     */
    async loadOnlineUsersOldAPI() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${ADMIN_MONITOR_CONFIG.BACKEND_BASE}/api/admin/online-users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const result = await response.json();
                const data = result.onlineUsers || result.data || result || [];
                this.onlineUsers = new Set(Array.isArray(data) ? data.map(u => u.userId || u.email) : []);
                this.updateOnlineUsersCount(this.onlineUsers.size);
            } else {
                this.loadOnlineUsersFromLocalStorage();
            }
        } catch (error) {
            console.warn('Fallback failed, using localStorage:', error.message);
            this.loadOnlineUsersFromLocalStorage();
        }
    }

    /**
     * Load online users from localStorage (fallback)
     */
    loadOnlineUsersFromLocalStorage() {
        try {
            const activityData = localStorage.getItem('user_activity_data');
            if (activityData) {
                const data = JSON.parse(activityData);
                const now = Date.now();
                const ONLINE_THRESHOLD = 60000; // 1 minute

                Object.keys(data).forEach(userId => {
                    const user = data[userId];
                    if (user.lastSeen && (now - user.lastSeen) < ONLINE_THRESHOLD) {
                        this.onlineUsers.add(user.email);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading activity from localStorage:', error);
        }
    }

    /**
     * Load wishlist data for all customers
     */
    async loadWishlistData() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${ADMIN_MONITOR_CONFIG.BACKEND_BASE}/api/admin/wishlist`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const result = await response.json();
                this.wishlistData = result.wishlist || result.data || result || [];
            } else {
                // Try to load from localStorage
                this.loadWishlistFromLocalStorage();
            }
        } catch (error) {
            console.warn('Loading wishlist from localStorage:', error.message);
            this.loadWishlistFromLocalStorage();
        }
    }

    /**
     * Load wishlist from localStorage (fallback)
     */
    loadWishlistFromLocalStorage() {
        try {
            // Aggregate wishlist data from localStorage keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('wishlist_')) {
                    const email = key.replace('wishlist_', '');
                    const wishlist = JSON.parse(localStorage.getItem(key) || '[]');
                    if (wishlist.length > 0) {
                        this.wishlistData[email] = wishlist;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading wishlist from localStorage:', error);
        }
    }

    /**
     * Render customers table with activity indicators
     */
    renderCustomersTable() {
        const tbody = document.getElementById('customersTableBody');
        if (!tbody) {
            console.warn('Customers table body not found');
            return;
        }

        tbody.innerHTML = '';

        // Ensure customers is an array
        const customersList = Array.isArray(this.customers) ? this.customers : [];
        
        customersList.forEach(customer => {
            const row = this.createCustomerRow(customer);
            tbody.appendChild(row);
        });

        // Update stats
        this.updateStats();
    }

    /**
     * Create a customer table row
     */
    createCustomerRow(customer) {
        const row = document.createElement('tr');
        const isOnline = this.isCustomerOnline(customer.email);
        const wishlistCount = this.getWishlistCount(customer.email);
        const activityStatus = this.getActivityStatus(customer.email);

        row.innerHTML = `
            <td>${customer.id || customer.email.split('@')[0]}</td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="status-indicator ${isOnline ? 'online' : 'offline'}" 
                          title="${activityStatus}">
                    </span>
                    <span class="ms-2">${customer.name || 'N/A'}</span>
                </div>
            </td>
            <td>${customer.email}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.orders || 0}</td>
            <td>$${(customer.totalSpent || 0).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" 
                        onclick="adminActivityMonitor.viewCustomerDetails('${customer.email}')"
                        title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning ${wishlistCount === 0 ? 'disabled' : ''}" 
                        onclick="adminActivityMonitor.viewWishlist('${customer.email}')"
                        title="View Wishlist">
                    <i class="fas fa-heart"></i>
                    ${wishlistCount > 0 ? `<span class="badge bg-danger">${wishlistCount}</span>` : ''}
                </button>
                <button class="btn btn-sm btn-outline-info" 
                        onclick="adminActivityMonitor.viewActivityLog('${customer.email}')"
                        title="Activity Log">
                    <i class="fas fa-chart-line"></i>
                </button>
            </td>
        `;

        return row;
    }

    /**
     * Check if customer is online
     */
    isCustomerOnline(email) {
        return this.onlineUsers.has(email);
    }

    /**
     * Get wishlist count for customer
     */
    getWishlistCount(email) {
        return this.wishlistData[email]?.length || 0;
    }

    /**
     * Get activity status text
     */
    getActivityStatus(email) {
        const activityData = localStorage.getItem('user_activity_data');
        if (!activityData) return 'No activity data';

        try {
            const data = JSON.parse(activityData);
            const userId = Object.keys(data).find(id => data[id].email === email);
            
            if (!userId || !data[userId]) return 'Never active';

            const user = data[userId];
            const timeSince = Date.now() - user.lastSeen;

            if (timeSince < 60000) return 'Online now';
            
            const minutes = Math.floor(timeSince / 60000);
            if (minutes < 60) return `Active ${minutes} min ago`;
            
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `Active ${hours}h ago`;
            
            const days = Math.floor(hours / 24);
            return `Active ${days}d ago`;
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * View customer details
     */
    viewCustomerDetails(email) {
        const customer = this.customers.find(c => c.email === email);
        if (!customer) return;

        const activityStatus = this.getActivityStatus(email);
        const isOnline = this.isCustomerOnline(email);

        Swal.fire({
            title: 'Customer Details',
            html: `
                <div class="text-start">
                    <div class="mb-3">
                        <strong>Status:</strong> 
                        <span class="badge ${isOnline ? 'bg-success' : 'bg-secondary'}">
                            ${isOnline ? '🟢 Online' : '⚫ Offline'}
                        </span>
                        <small class="text-muted ms-2">${activityStatus}</small>
                    </div>
                    <div class="mb-2"><strong>Name:</strong> ${customer.name || 'N/A'}</div>
                    <div class="mb-2"><strong>Email:</strong> ${customer.email}</div>
                    <div class="mb-2"><strong>Phone:</strong> ${customer.phone || 'N/A'}</div>
                    <div class="mb-2"><strong>Total Orders:</strong> ${customer.orders || 0}</div>
                    <div class="mb-2"><strong>Total Spent:</strong> $${(customer.totalSpent || 0).toFixed(2)}</div>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Close'
        });
    }

    /**
     * View customer wishlist
     */
    viewWishlist(email) {
        const wishlist = this.wishlistData[email] || [];
        
        if (wishlist.length === 0) {
            Swal.fire({
                title: 'Empty Wishlist',
                text: 'This customer has no items in their wishlist.',
                icon: 'info'
            });
            return;
        }

        const wishlistHTML = wishlist.map(item => `
            <div class="wishlist-item mb-3 p-2 border-bottom">
                <div class="row align-items-center">
                    <div class="col-3">
                        <img src="${item.image || 'img/product-1.jpg'}" 
                             alt="${item.name}" 
                             class="img-fluid rounded"
                             style="max-height: 80px; object-fit: cover;">
                    </div>
                    <div class="col-9">
                        <h6 class="mb-1">${item.name}</h6>
                        <p class="mb-0 text-primary fw-bold">$${item.price.toFixed(2)}</p>
                        ${item.addedAt ? `<small class="text-muted">Added: ${new Date(item.addedAt).toLocaleDateString()}</small>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        Swal.fire({
            title: `${email}'s Wishlist`,
            html: `
                <div class="wishlist-container" style="max-height: 400px; overflow-y: auto;">
                    ${wishlistHTML}
                </div>
                <div class="mt-3">
                    <strong>Total Items: ${wishlist.length}</strong>
                </div>
            `,
            width: '600px',
            confirmButtonText: 'Close'
        });
    }

    /**
     * View activity log
     */
    viewActivityLog(email) {
        const activityData = localStorage.getItem('user_activity_data');
        
        Swal.fire({
            title: 'Activity Log',
            html: `
                <div class="text-start">
                    <p><strong>Customer:</strong> ${email}</p>
                    <p><strong>Status:</strong> ${this.getActivityStatus(email)}</p>
                    <p class="text-muted">Detailed activity logging coming soon...</p>
                </div>
            `,
            icon: 'info'
        });
    }

    /**
     * Update dashboard stats
     */
    updateStats() {
        // Update online users count
        const onlineCount = this.onlineUsers.size;
        const totalCustomers = this.customers.length;
        
        // Update stats cards if they exist
        this.updateOnlineUsersCount(onlineCount);

        const totalCustomersEl = document.getElementById('totalCustomersCount');
        if (totalCustomersEl) {
            totalCustomersEl.textContent = totalCustomers;
        }

        // Update wishlist stats
        const totalWishlistItems = Object.values(this.wishlistData)
            .reduce((sum, wishlist) => sum + wishlist.length, 0);
        
        const wishlistStatsEl = document.getElementById('totalWishlistItems');
        if (wishlistStatsEl) {
            wishlistStatsEl.textContent = totalWishlistItems;
        }
    }

    /**
     * Update online users count display
     */
    updateOnlineUsersCount(count) {
        const onlineStatsEl = document.getElementById('onlineUsersCount');
        if (onlineStatsEl) {
            onlineStatsEl.textContent = count;
            
            // Add pulse animation
            onlineStatsEl.classList.add('pulse');
            setTimeout(() => {
                onlineStatsEl.classList.remove('pulse');
            }, 1000);
        }
    }

    /**
     * Update online users count with animation
     */
    updateOnlineUsersCount(count) {
        const onlineStatsEl = document.getElementById('onlineUsersCount');
        if (onlineStatsEl) {
            onlineStatsEl.textContent = count;
            // Add pulse animation
            onlineStatsEl.classList.add('pulse');
            setTimeout(() => {
                onlineStatsEl.classList.remove('pulse');
            }, 600);
        }
    }

    /**
     * Render empty daily chart
     */
    renderEmptyDailyChart() {
        const chartContainer = document.getElementById('dailyStatsChart');
        if (!chartContainer) return;
        
        chartContainer.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-chart-bar fa-3x mb-3" style="opacity: 0.3;"></i>
                <p class="mb-0">No daily visit data available yet</p>
                <small>Data will appear once users start browsing the site</small>
            </div>
        `;
    }

    /**
     * Render empty hourly chart
     */
    renderEmptyHourlyChart() {
        const chartContainer = document.getElementById('hourlyStatsChart');
        if (!chartContainer) return;
        
        chartContainer.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-clock fa-3x mb-3" style="opacity: 0.3;"></i>
                <p class="mb-0">No hourly visit data available yet</p>
                <small>Peak hours will be calculated after some usage</small>
            </div>
        `;
    }

    /**
     * Load daily visit statistics
     */
    async loadDailyStats() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${ADMIN_MONITOR_CONFIG.BACKEND_BASE}/api/activity/stats/daily`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                // Handle different response structures
                const stats = result.stats || result.data || result || [];
                // Ensure stats is an array
                if (Array.isArray(stats) && stats.length > 0) {
                    this.renderDailyStatsChart(stats);
                } else {
                    this.renderEmptyDailyChart();
                }
            } else {
                this.renderEmptyDailyChart();
            }
        } catch (error) {
            console.error('Failed to load daily stats:', error);
            this.renderEmptyDailyChart();
        }
    }

    /**
     * Load hourly visit statistics (peak times)
     */
    async loadHourlyStats() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${ADMIN_MONITOR_CONFIG.BACKEND_BASE}/api/activity/stats/hourly`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                // Handle different response structures
                const stats = result.stats || result.data || result || [];
                // Ensure stats is an array
                if (Array.isArray(stats) && stats.length > 0) {
                    this.renderHourlyStatsChart(stats);
                } else {
                    this.renderEmptyHourlyChart();
                }
            } else {
                this.renderEmptyHourlyChart();
            }
        } catch (error) {
            console.error('Failed to load hourly stats:', error);
            this.renderEmptyHourlyChart();
        }
    }

    /**
     * Render daily stats chart (simple bar chart using HTML/CSS)
     */
    renderDailyStatsChart(stats) {
        const chartContainer = document.getElementById('dailyStatsChart');
        if (!chartContainer) return;

        // Ensure stats is an array and has data
        if (!Array.isArray(stats) || stats.length === 0) {
            this.renderEmptyDailyChart();
            return;
        }

        const maxVisits = Math.max(...stats.map(s => s.visit_count || 0));
        
        chartContainer.innerHTML = stats.slice(0, 7).reverse().map(day => {
            const visitCount = day.visit_count || 0;
            const percentage = maxVisits > 0 ? (visitCount / maxVisits) * 100 : 0;
            const date = new Date(day.visit_date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            
            return `
                <div class="chart-bar-item mb-2">
                    <div class="d-flex justify-content-between mb-1">
                        <small>${date}</small>
                        <small><strong>${visitCount}</strong> visits</small>
                    </div>
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar bg-primary" 
                             role="progressbar" 
                             style="width: ${percentage}%" 
                             aria-valuenow="${visitCount}" 
                             aria-valuemin="0" 
                             aria-valuemax="${maxVisits}">
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render hourly stats chart (peak times)
     */
    renderHourlyStatsChart(stats) {
        const chartContainer = document.getElementById('hourlyStatsChart');
        if (!chartContainer) return;

        // Ensure stats is an array and has data
        if (!Array.isArray(stats) || stats.length === 0) {
            this.renderEmptyHourlyChart();
            return;
        }

        const maxVisits = Math.max(...stats.map(s => s.visit_count || 0));
        
        // Group by hour and show top 8 peak hours
        const sortedStats = stats.sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0)).slice(0, 8);
        
        chartContainer.innerHTML = sortedStats.map(hour => {
            const visitCount = hour.visit_count || 0;
            const percentage = maxVisits > 0 ? (visitCount / maxVisits) * 100 : 0;
            const hourOfDay = hour.hour_of_day || hour.hour || 0;
            const hourLabel = `${hourOfDay}:00 - ${hourOfDay}:59`;
            
            return `
                <div class="chart-bar-item mb-2">
                    <div class="d-flex justify-content-between mb-1">
                        <small>${hourLabel}</small>
                        <small><strong>${visitCount}</strong> visits</small>
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-success" 
                             role="progressbar" 
                             style="width: ${percentage}%" 
                             aria-valuenow="${visitCount}" 
                             aria-valuemin="0" 
                             aria-valuemax="${maxVisits}">
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.loadAllData();
        }, ADMIN_MONITOR_CONFIG.REFRESH_INTERVAL);
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshActivityBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAllData();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportCustomersBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportCustomersData();
            });
        }
    }

    /**
     * Export customers data
     */
    exportCustomersData() {
        const csvData = this.customers.map(customer => ({
            'Customer ID': customer.id || customer.email.split('@')[0],
            'Name': customer.name || 'N/A',
            'Email': customer.email,
            'Phone': customer.phone || 'N/A',
            'Status': this.isCustomerOnline(customer.email) ? 'Online' : 'Offline',
            'Last Activity': this.getActivityStatus(customer.email),
            'Wishlist Items': this.getWishlistCount(customer.email),
            'Orders': customer.orders || 0,
            'Total Spent': `$${(customer.totalSpent || 0).toFixed(2)}`
        }));

        const csv = this.convertToCSV(csvData);
        this.downloadCSV(csv, 'customers-activity-report.csv');
    }

    /**
     * Convert data to CSV
     */
    convertToCSV(data) {
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return `"${value}"`;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Download CSV file
     */
    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    /**
     * Get mock customers for testing
     */
    getMockCustomers() {
        return [
            {
                id: 'CUST001',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                orders: 5,
                totalSpent: 450.00
            },
            {
                id: 'CUST002',
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '+0987654321',
                orders: 3,
                totalSpent: 320.00
            }
        ];
    }
}

// Initialize global monitor
const adminActivityMonitor = new AdminActivityMonitor();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if on admin dashboard page
    if (document.getElementById('customersTableBody')) {
        adminActivityMonitor.init();
    }
});

// Export for use in other scripts
window.adminActivityMonitor = adminActivityMonitor;
