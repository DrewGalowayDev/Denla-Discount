/**
 * Admin Activity Monitor
 * Displays real-time user activity and wishlist data
 */

const ADMIN_MONITOR_CONFIG = {
    REFRESH_INTERVAL: 10000, // Refresh every 10 seconds
    BACKEND_BASE: 'http://localhost:5000'
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
            const response = await fetch(`${ADMIN_MONITOR_CONFIG.BACKEND_BASE}/api/users/customers`);
            if (response.ok) {
                this.customers = await response.json();
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
     * Load online users activity
     */
    async loadOnlineUsers() {
        try {
            const response = await fetch(`${ADMIN_MONITOR_CONFIG.BACKEND_BASE}/api/activity/online-users`);
            if (response.ok) {
                const data = await response.json();
                this.onlineUsers = new Set(data.map(u => u.userId || u.email));
            } else {
                // Check localStorage for activity data
                this.loadOnlineUsersFromLocalStorage();
            }
        } catch (error) {
            console.warn('Loading online users from localStorage:', error.message);
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
            const response = await fetch(`${ADMIN_MONITOR_CONFIG.BACKEND_BASE}/api/wishlist/all`);
            if (response.ok) {
                const data = await response.json();
                this.wishlistData = data;
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

        this.customers.forEach(customer => {
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
        const onlineStatsEl = document.getElementById('onlineUsersCount');
        if (onlineStatsEl) {
            onlineStatsEl.textContent = onlineCount;
        }

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
