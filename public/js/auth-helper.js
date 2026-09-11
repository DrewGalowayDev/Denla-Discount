/**
 * Awesome Technologies - Authentication Helper
 * Manages user authentication state and events
 */

class AuthHelper {
    constructor() {
        this.initializeAuthState();
    }

    // Initialize authentication state
    initializeAuthState() {
        // Check if user is logged in on page load
        const user = this.getCurrentUser();
        const token = this.getToken();

        if (user && token) {
            const userName = user.username || user.name || user.email || 'User';
            console.log('User is logged in:', userName);
        } else {
            console.log('User is not logged in (guest mode)');
        }
    }

    // Get current user
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    // Get authentication token
    getToken() {
        return localStorage.getItem('token');
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!(this.getCurrentUser() && this.getToken());
    }

    // Login user
    async login(username, password) {
        try {
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000/api'
                : '/api';
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();
            
            // Save user and token
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);

            // Dispatch login event for cart manager to merge carts
            window.dispatchEvent(new CustomEvent('userLoggedIn', { 
                detail: { user: data.user } 
            }));

            console.log('Login successful:', data.user.username);
            return { success: true, user: data.user };

        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Register user
    async register(userData) {
        try {
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000/api'
                : '/api';
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            const data = await response.json();
            
            // Save user and token
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);

            // Dispatch login event
            window.dispatchEvent(new CustomEvent('userLoggedIn', { 
                detail: { user: data.user } 
            }));

            console.log('Registration successful:', data.user.username);
            return { success: true, user: data.user };

        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout user
    logout() {
        const user = this.getCurrentUser();
        
        // Clear authentication data
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Dispatch logout event (cart stays in localStorage)
        window.dispatchEvent(new Event('userLoggedOut'));

        console.log('User logged out:', user?.username);
        
        // Optionally redirect to home page
        // window.location.href = 'index.html';
    }

    // Update user profile in localStorage
    updateUserProfile(updatedUser) {
        try {
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('User profile updated');
            return true;
        } catch (error) {
            console.error('Error updating user profile:', error);
            return false;
        }
    }

    // Get auth headers for API calls
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    // Verify if token is still valid
    async verifyToken() {
        const token = this.getToken();
        if (!token) {
            return false;
        }

        try {
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000/api'
                : '/api';
            const response = await fetch(`${API_URL}/auth/verify`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                return true;
            } else {
                // Token expired or invalid
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            return false;
        }
    }

    // Update UI based on authentication state
    updateAuthUI() {
        const user = this.getCurrentUser();
        
        // Update topbar dropdown
        const loginDropdownItem = document.getElementById('loginDropdownItem');
        const signupDropdownItem = document.getElementById('signupDropdownItem');
        const dashboardDropdownItem = document.getElementById('dashboardDropdownItem');
        const logoutDropdownItem = document.getElementById('logoutDropdownItem');
        const authDivider = document.getElementById('authDivider');
        
        // Update header buttons
        const loginBtn = document.getElementById('loginBtn');
        const dashboardBtn = document.getElementById('dashboardBtn');
        const userMenuDropdown = document.getElementById('userMenuDropdown');
        const userMenuName = document.getElementById('userMenuName');
        
        if (user) {
            // User is logged in
            const userName = user.username || user.name || user.email || 'User';
            
            // Update dropdown items
            if (loginDropdownItem) loginDropdownItem.style.display = 'none';
            if (signupDropdownItem) signupDropdownItem.style.display = 'none';
            if (dashboardDropdownItem) dashboardDropdownItem.style.display = '';
            if (logoutDropdownItem) logoutDropdownItem.style.display = '';
            
            // Update header buttons
            if (loginBtn) loginBtn.style.display = 'none';
            if (dashboardBtn) {
                dashboardBtn.style.display = 'inline-block';
            }
            if (userMenuDropdown) {
                userMenuDropdown.style.display = 'inline-block';
            }
            if (userMenuName) {
                userMenuName.textContent = userName;
            }
        } else {
            // User is not logged in
            
            // Update dropdown items
            if (loginDropdownItem) loginDropdownItem.style.display = '';
            if (signupDropdownItem) signupDropdownItem.style.display = '';
            if (dashboardDropdownItem) dashboardDropdownItem.style.display = 'none';
            if (logoutDropdownItem) logoutDropdownItem.style.display = 'none';
            
            // Update header buttons
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (dashboardBtn) dashboardBtn.style.display = 'none';
            if (userMenuDropdown) userMenuDropdown.style.display = 'none';
        }
    }
}

// Global logout handler
function handleLogout(event) {
    if (event) event.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
        window.authHelper.logout();
        
        // Show notification
        if (window.cartManager) {
            window.cartManager.showNotification(
                'Logged Out', 
                'You have been successfully logged out.', 
                'info'
            );
        }
        
        // Update UI
        window.authHelper.updateAuthUI();
        
        // Redirect to home if on dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
    }
}

// Global function to clean up modal backdrops
function cleanupModalBackdrop() {
    // Remove all modal backdrops
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.remove();
    });
    
    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    
    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

// Create global auth instance
window.authHelper = new AuthHelper();

// Update UI on page load
document.addEventListener('DOMContentLoaded', () => {
    window.authHelper.updateAuthUI();
    
    // Add cleanup listeners to all modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('hidden.bs.modal', cleanupModalBackdrop);
    });
});

// Update UI when user logs in or out
window.addEventListener('userLoggedIn', () => {
    window.authHelper.updateAuthUI();
});

window.addEventListener('userLoggedOut', () => {
    window.authHelper.updateAuthUI();
});
