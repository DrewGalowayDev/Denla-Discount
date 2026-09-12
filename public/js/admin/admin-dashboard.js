/**
 * Admin Dashboard Main Module
 * Handles navigation, UI interactions, and dashboard stats with real-time data
 */

// Global variables
let currentSection = 'dashboard';
let salesChart, categoryChart;

// ============================================
// NAVIGATION                
// ============================================

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    sidebar.classList.toggle('show');
}

// Section Navigation
function initNavigation() {
    const menuLinks = document.querySelectorAll('.sidebar-menu a[data-section]');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;

        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`a[data-section="${sectionName}"]`)?.parentElement.classList.add('active');

        // Load section data
        loadSectionData(sectionName);
    }

    // Close sidebar on mobile after navigation
    if (window.innerWidth < 992) {
        document.getElementById('adminSidebar').classList.remove('show');
    }
}

// ============================================
// LOAD SECTION DATA
// ============================================

function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'products':
            if (typeof loadProducts === 'function') loadProducts();
            break;
        case 'orders':
            if (typeof loadOrders === 'function') loadOrders();
            break;
        case 'customers':
            if (typeof loadCustomers === 'function') loadCustomers();
            break;
        case 'analytics':
            if (typeof loadAnalytics === 'function') loadAnalytics();
            break;
        case 'categories':
            if (typeof loadCategories === 'function') loadCategories();
            break;
        case 'contact-messages':
            if (typeof loadContactMessages === 'function') loadContactMessages();
            break;
    }
}

// ============================================
// DASHBOARD STATS (REAL-TIME DATA)
// ============================================

async function loadDashboardStats() {
    // Safety timeout to hide spinner after 30 seconds max
    const spinnerTimeout = setTimeout(() => {
        showSpinner(false);
        console.warn('Dashboard stats loading timeout - hiding spinner');
    }, 30000);
    
    try {
        showSpinner(true);

        // Fetch data sequentially with delay to avoid rate limiting
        // Instead of Promise.all, use sequential requests
        let productsData = { success: false, products: [] };
        let ordersData = { success: false, orders: [] };
        let usersData = { success: false, users: [] };

        try {
            productsData = await apiRequest('/products');
        } catch (err) {
            console.warn('Failed to load products:', err.message);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            ordersData = await apiRequest('/orders/admin/all');
        } catch (err) {
            console.warn('Failed to load orders:', err.message);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            usersData = await apiRequest('/admin/users');
        } catch (err) {
            console.warn('Failed to load users:', err.message);
        }

        // Calculate stats
        const stats = {
            totalProducts: productsData.success ? productsData.products.length : 0,
            totalOrders: ordersData.success ? ordersData.orders.length : 0,
            totalCustomers: usersData.success ? usersData.users.filter(u => u.role === 'customer').length : 0,
            totalSales: 0
        };

        // Calculate total sales from paid orders
        if (ordersData.success && ordersData.orders) {
            stats.totalSales = ordersData.orders
                .filter(order => order.payment_status === 'paid')
                .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
        }

        // Update stats cards
        const salesEl = document.getElementById('totalSales');
        const ordersEl = document.getElementById('totalOrders');
        const productsEl = document.getElementById('totalProducts');
        const customersEl = document.getElementById('totalCustomers');

        if (salesEl) salesEl.textContent = formatCurrency(stats.totalSales);
        if (ordersEl) ordersEl.textContent = stats.totalOrders.toLocaleString();
        if (productsEl) productsEl.textContent = stats.totalProducts.toLocaleString();
        if (customersEl) customersEl.textContent = stats.totalCustomers.toLocaleString();

        // Load charts with real data
        await loadSalesChartData(ordersData.orders || []);
        await loadCategoryChartData(productsData.products || []);
        await loadRecentOrders(ordersData.orders || []);
        await loadTopProducts(productsData.products || [], ordersData.orders || []);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showAPIError(error);
    } finally {
        clearTimeout(spinnerTimeout);
        showSpinner(false);
    }
}

// ============================================
// SALES CHART (REAL-TIME DATA)
// ============================================

async function loadSalesChartData(orders) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    if (salesChart) {
        salesChart.destroy();
    }

    // Ensure orders is an array
    const ordersList = Array.isArray(orders) ? orders : [];

    // Calculate sales for last 4 weeks
    const today = new Date();
    const weeklyData = [];
    const labels = [];

    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (i + 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekSales = ordersList
            .filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= weekStart && orderDate < weekEnd && order.payment_status === 'paid';
            })
            .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        weeklyData.push(weekSales);
        labels.push(`Week ${4 - i}`);
    }

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (KSh)',
                data: weeklyData,
                borderColor: '#2575fc',
                backgroundColor: 'rgba(37, 117, 252, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return 'KSh ' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// CATEGORY CHART (REAL-TIME DATA)
// ============================================

async function loadCategoryChartData(products) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (categoryChart) {
        categoryChart.destroy();
    }

    // Get categories data
    let categoriesData = [];
    try {
        const data = await apiRequest('/categories');
        if (data && data.success && Array.isArray(data.categories)) {
            categoriesData = data.categories;
        } else if (data && Array.isArray(data.data)) {
            // Handle legacy format with data property
            categoriesData = data.data;
        } else if (data && Array.isArray(data)) {
            // Handle case where API returns array directly
            categoriesData = data;
        }
    } catch (error) {
        console.error('Error loading categories for chart:', error);
    }

    // Ensure categoriesData is an array
    if (!Array.isArray(categoriesData)) {
        categoriesData = [];
    }

    // Define vibrant color palette for categories
    const colorPalette = [
        '#FF6B35',  // Orange (Groceries)
        '#4ECDC4',  // Turquoise (Beverages)
        '#FFD93D',  // Yellow (Dairy Products)
        '#6BCF7F',  // Green (Household Items)
        '#A78BFA',  // Purple (Personal Care)
        '#F87171',  // Red (Meat & Poultry)
        '#60A5FA',  // Blue (Bakery)
        '#FBBF24',  // Amber (Fruits & Vegetables)
        '#EC4899',  // Pink (Snacks)
        '#10B981'   // Emerald (Others)
    ];

    // Count products per category
    const categoryCounts = {};
    const categoryColors = {};
    const categoryNames = {};

    categoriesData.forEach((cat, index) => {
        categoryCounts[cat.id] = 0;
        // Use color from database if available, otherwise use palette color
        categoryColors[cat.id] = cat.color || colorPalette[index % colorPalette.length];
        categoryNames[cat.id] = cat.name;
    });

    // Ensure products is an array
    const productsList = Array.isArray(products) ? products : [];
    
    productsList.forEach(product => {
        if (product.category_id && categoryCounts.hasOwnProperty(product.category_id)) {
            categoryCounts[product.category_id]++;
        }
    });

    const labels = Object.keys(categoryCounts).map(id => categoryNames[id]);
    const data = Object.values(categoryCounts);
    const colors = Object.keys(categoryCounts).map(id => categoryColors[id]);

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
                data: data.length > 0 ? data : [1],
                backgroundColor: colors.length > 0 ? colors : ['#cccccc'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} items (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// RECENT ORDERS (REAL-TIME DATA)
// ============================================

async function loadRecentOrders(orders) {
    const tbody = document.getElementById('recentOrders');
    if (!tbody) return;

    // Ensure orders is an array
    const ordersList = Array.isArray(orders) ? orders : [];

    // Get 5 most recent orders
    const recentOrders = ordersList
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No recent orders</td></tr>';
        return;
    }

    tbody.innerHTML = recentOrders.map(order => `
        <tr>
            <td><strong>${order.order_number}</strong></td>
            <td>${order.users?.name || 'N/A'}</td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td><span class="status-badge ${order.status}">${order.status}</span></td>
            <td>
                <button class="action-btn view" onclick="viewOrderFromDashboard('${order.id}')" title="View Order">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// View order from dashboard
function viewOrderFromDashboard(orderId) {
    showSection('orders');
    // Give it a moment to load, then view the order
    setTimeout(() => {
        if (typeof viewOrderDetails === 'function') {
            viewOrderDetails(orderId);
        }
    }, 500);
}

// ============================================
// TOP PRODUCTS (REAL-TIME DATA)
// ============================================

async function loadTopProducts(products, orders) {
    const container = document.getElementById('topProducts');
    if (!container) return;

    // Ensure orders is an array
    const ordersList = Array.isArray(orders) ? orders : [];

    // Calculate sales per product from order items
    const productSales = {};

    ordersList.forEach(order => {
        if (order.order_items) {
            order.order_items.forEach(item => {
                const productId = item.product_id;
                if (!productSales[productId]) {
                    productSales[productId] = {
                        name: item.product_name || item.products?.name || 'Unknown Product',
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[productId].quantity += parseInt(item.quantity || 0);
                productSales[productId].revenue += parseFloat(item.price || 0) * parseInt(item.quantity || 0);
            });
        }
    });

    // Sort by quantity sold
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    if (topProducts.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No sales data available</p>';
        return;
    }

    container.innerHTML = topProducts.map((product, index) => `
        <div class="top-product-item">
            <div class="top-product-rank">${index + 1}</div>
            <div class="top-product-info">
                <div class="top-product-name">${product.name}</div>
                <div class="top-product-sales">${product.quantity} sales • ${formatCurrency(product.revenue)}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Refresh Data
function refreshData() {
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    if (icon) icon.classList.add('fa-spin');

    // Reload current section
    loadSectionData(currentSection);

    setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
        showToast('success', 'Data refreshed successfully!');
    }, 1000);
}

// Show Notifications
async function showNotifications() {
    // In production, fetch real notifications from API
    Swal.fire({
        title: 'Notifications',
        html: `
            <div class="text-start">
                <p><i class="fas fa-info-circle text-info"></i> Welcome to the admin dashboard</p>
                <p><i class="fas fa-box text-warning"></i> Check products with low stock</p>
                <p><i class="fas fa-sync text-primary"></i> Click refresh to load latest data</p>
            </div>
        `,
        showCloseButton: true,
        showConfirmButton: false
    });
}

// Toast Notification
function showToast(type, message) {
    if (typeof Swal === 'undefined') return;

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
}

// Show/hide spinner
function showSpinner(show) {
    let spinner = document.getElementById('spinner');
    if (!spinner && show) {
        // Create spinner if it doesn't exist
        const spinnerDiv = document.createElement('div');
        spinnerDiv.id = 'spinner';
        spinnerDiv.className = 'global-spinner';
        spinnerDiv.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        spinnerDiv.style.display = 'none';
        document.body.appendChild(spinnerDiv);
        spinner = spinnerDiv;
    }
    
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

// Clean up any stale overlays (only when no modal is actively shown)
function cleanupOverlays() {
    // Check if any modal is currently shown
    const activeModal = document.querySelector('.modal.show');
    if (activeModal) {
        // Don't cleanup if a modal is actively displayed
        return;
    }
    
    // Remove any stale modal backdrops (only if no modal is open)
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    
    // Remove any loading notifications that might have leaked
    document.querySelectorAll('.loading-notification-overlay, .loading-notification, #loading-overlay, #loading-notification').forEach(el => el.remove());
    
    // Hide any spinners
    const spinner = document.getElementById('spinner');
    if (spinner) spinner.style.display = 'none';
    
    // Hide global loader
    const globalLoader = document.getElementById('globalLoader');
    if (globalLoader) globalLoader.style.display = 'none';
    
    // Ensure body is not locked (only if no modal is open)
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Ensure main content is clickable
    const mainContent = document.querySelector('.admin-content');
    if (mainContent) {
        mainContent.style.pointerEvents = '';
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Clean up any stale overlays first (only runs once at load)
    cleanupOverlays();
    
    initNavigation();
    showSection('dashboard');

    // Global search
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase();
                if (query.length > 2) {
                    // Implement global search across all sections
                    console.log('Searching:', query);
                    showToast('info', 'Search functionality coming soon');
                }
            }, 500);
        });
    }

    // Log initialization
    console.log('Admin Dashboard initialized with real-time data integration');
});
