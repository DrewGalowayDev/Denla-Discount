/**
 * My Account Link Authentication Handler
 * Checks if user is logged in before redirecting to dashboard
 * If not logged in, redirects directly to login.html
 */

(function() {
    'use strict';

    // Handle My Account link clicks
    function handleMyAccountClick(e) {
        e.preventDefault();
        
        // Check if user is logged in
        let user = null;
        try {
            user = window.authHelper?.getCurrentUser() || JSON.parse(localStorage.getItem('user'));
        } catch (err) {
            user = null;
        }
        const token = localStorage.getItem('token');
        
        if (user && token) {
            // User is logged in, redirect to appropriate dashboard
            const role = (user.role || '').toLowerCase();
            if (role === 'admin' || role === 'manager') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            // User not logged in, redirect to login page with return url
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            if (currentPage && currentPage !== 'index.html' && currentPage !== 'login.html') {
                window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
            } else {
                window.location.href = 'login.html';
            }
        }
    }
    
    // Initialize when DOM is ready
    function initialize() {
        // Find all My Account links
        const myAccountLinks = document.querySelectorAll('[id*="myAccount"], a[href*="dashboard.html"]');
        
        myAccountLinks.forEach(link => {
            // Only handle links that should trigger authentication check
            if (link.textContent.includes('My Account') || link.textContent.includes('Dashboard')) {
                // Remove direct href navigation to allow handler to decide destination
                link.setAttribute('href', '#');
                link.removeEventListener('click', handleMyAccountClick);
                link.addEventListener('click', handleMyAccountClick);
            }
        });
        
        // Update My Account link text if user is logged in
        let user = null;
        try {
            user = window.authHelper?.getCurrentUser() || JSON.parse(localStorage.getItem('user'));
        } catch (err) {
            user = null;
        }
        if (user) {
            const userName = user.username || user.name || user.email || 'User';
            myAccountLinks.forEach(link => {
                if (link.id === 'myAccountLink') {
                    link.innerHTML = '<i class="fas fa-user-circle me-1"></i>' + userName;
                }
            });
        }
    }
    
    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Also run when user logs in or out
    window.addEventListener('userLoggedIn', initialize);
    window.addEventListener('userLoggedOut', initialize);
    
})();
