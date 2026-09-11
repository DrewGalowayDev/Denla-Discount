/**
 * Admin Authentication Module
 * Handles admin role verification and redirects
 */

/**
 * Admin Authentication & API Configuration Module
 * Handles admin authentication, API requests, and error handling
 */

// ============================================
// CONFIGURATION
// ============================================

const API_CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : '/api'
};

// ============================================
// AUTHENTICATION
// ============================================

// Check if user is authenticated and is admin
function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user || user.role !== 'admin') {
        // Redirect to homepage if not admin
        console.warn('Unauthorized access attempt - redirecting to homepage');
        window.location.href = 'index.html';
        return false;
    }

    // Update UI with user info
    if (user.name) {
        const userNameEl = document.querySelector('.user-name');
        if (userNameEl) {
            userNameEl.textContent = user.name;
        }
    }

    return true;
}

// Logout function
function logout() {
    Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        }
    });
}

// ============================================
// API REQUEST HANDLER
// ============================================

let activeRequests = 0;

// Show/hide global loading indicator
function setGlobalLoading(isLoading) {
    activeRequests += isLoading ? 1 : -1;

    // Optional: Add global loading indicator
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = activeRequests > 0 ? 'block' : 'none';
    }
}

// Main API request function - simplified for reliability
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No authentication token found');
        window.location.href = 'index.html';
        throw new Error('Authentication required');
    }

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            // Handle error types
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
                throw new Error('Session expired. Please login again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. Insufficient permissions.');
            } else if (response.status === 404) {
                throw new Error('Resource not found.');
            } else if (response.status === 500) {
                throw new Error(data.message || 'Server error. Please try again later.');
            }

            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error('API Error:', {
            endpoint,
            error: error.message,
            timestamp: new Date().toISOString()
        });

        throw error;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format currency (Kenyan Shillings)
function formatCurrency(amount) {
    return `KSh ${Number(amount).toLocaleString('en-KE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format datetime
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Toast notification (using existing showToast from dashboard)
function showAPIError(error) {
    const message = error.message || 'An error occurred';

    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
        });

        Toast.fire({
            icon: 'error',
            title: message
        });
    } else {
        alert(message);
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAdminAuth();
    
    // Initialize password change form
    initPasswordChangeForm();
    
    // Load admin profile data
    loadAdminProfile();

    // Log API configuration (development only)
    if (window.location.hostname === 'localhost') {
        console.log('Admin Dashboard - API Config:', {
            baseURL: API_CONFIG.BASE_URL,
            authenticated: !!localStorage.getItem('token')
        });
    }
});

// ============================================
// PASSWORD CHANGE FUNCTIONALITY
// ============================================

// Initialize password change form
function initPasswordChangeForm() {
    const form = document.getElementById('changePasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (!form) return;
    
    // Password strength indicator
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            checkPasswordMatch();
        });
    }
    
    // Password match checker
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    // Form submission
    form.addEventListener('submit', handlePasswordChange);
}

// Update password strength indicator
function updatePasswordStrength(password) {
    const strengthDiv = document.getElementById('passwordStrength');
    if (!strengthDiv) return;
    
    let strength = 0;
    let feedback = [];
    
    if (password.length >= 6) strength++;
    else feedback.push('At least 6 characters');
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('Add uppercase letter');
    
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    else feedback.push('Add a number');
    
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    else feedback.push('Add special character');
    
    let strengthText, strengthClass;
    if (password.length === 0) {
        strengthDiv.innerHTML = '';
        return;
    } else if (strength <= 2) {
        strengthText = 'Weak';
        strengthClass = 'text-danger';
    } else if (strength <= 4) {
        strengthText = 'Medium';
        strengthClass = 'text-warning';
    } else {
        strengthText = 'Strong';
        strengthClass = 'text-success';
    }
    
    const progressWidth = (strength / 6) * 100;
    strengthDiv.innerHTML = `
        <div class="progress" style="height: 5px;">
            <div class="progress-bar bg-${strengthClass.replace('text-', '')}" style="width: ${progressWidth}%"></div>
        </div>
        <small class="${strengthClass}">${strengthText}</small>
        ${feedback.length > 0 ? `<small class="text-muted ms-2">(${feedback.slice(0, 2).join(', ')})</small>` : ''}
    `;
}

// Check if passwords match
function checkPasswordMatch() {
    const newPassword = document.getElementById('newPassword')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    const matchDiv = document.getElementById('passwordMatch');
    
    if (!matchDiv || confirmPassword.length === 0) {
        if (matchDiv) matchDiv.innerHTML = '';
        return;
    }
    
    if (newPassword === confirmPassword) {
        matchDiv.innerHTML = '<small class="text-success"><i class="fas fa-check me-1"></i>Passwords match</small>';
    } else {
        matchDiv.innerHTML = '<small class="text-danger"><i class="fas fa-times me-1"></i>Passwords do not match</small>';
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Handle password change form submission
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.getElementById('changePasswordBtn');
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Missing Fields',
            text: 'Please fill in all password fields'
        });
        return;
    }
    
    if (newPassword.length < 6) {
        Swal.fire({
            icon: 'error',
            title: 'Password Too Short',
            text: 'New password must be at least 6 characters long'
        });
        return;
    }
    
    if (newPassword !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Passwords Don\'t Match',
            text: 'New password and confirmation do not match'
        });
        return;
    }
    
    if (currentPassword === newPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Same Password',
            text: 'New password must be different from your current password'
        });
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Changing Password...';
    
    try {
        const response = await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        if (response.success) {
            // Clear form
            document.getElementById('changePasswordForm').reset();
            document.getElementById('passwordStrength').innerHTML = '';
            document.getElementById('passwordMatch').innerHTML = '';
            
            Swal.fire({
                icon: 'success',
                title: 'Password Changed!',
                text: 'Your password has been updated successfully.',
                confirmButtonText: 'Great!'
            });
        } else {
            throw new Error(response.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Password change error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Password Change Failed',
            text: error.message || 'Unable to change password. Please try again.'
        });
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Load admin profile data into settings
function loadAdminProfile() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const nameInput = document.getElementById('adminName');
    const emailInput = document.getElementById('adminEmail');
    
    if (nameInput && user.name) {
        nameInput.value = user.name;
    }
    
    if (emailInput && user.email) {
        emailInput.value = user.email;
    }
}

// Save notification settings
function saveNotificationSettings() {
    const emailNotifications = document.getElementById('emailNotifications')?.checked;
    const orderAlerts = document.getElementById('orderAlerts')?.checked;
    const stockAlerts = document.getElementById('stockAlerts')?.checked;
    
    // Save to localStorage for now
    const settings = { emailNotifications, orderAlerts, stockAlerts };
    localStorage.setItem('adminNotificationSettings', JSON.stringify(settings));
    
    Swal.fire({
        icon: 'success',
        title: 'Settings Saved',
        text: 'Notification preferences updated successfully',
        timer: 2000,
        showConfirmButton: false
    });
}
