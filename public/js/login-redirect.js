/**
 * Login & Auth Redirect Script
 * Automatically handles login modal submissions and post-auth redirections
 */

function handleLoginSuccess(user, token) {
    if (!user || !token) return;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Dispatch global event for other components (e.g. cart-manager)
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user } }));

    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect') || urlParams.get('returnUrl');

    if (user.role === 'admin' || user.role === 'manager' || user.role === 'inventory_clerk') {
        window.location.href = 'admin-dashboard.html';
    } else if (redirectParam && redirectParam.length > 0 && !redirectParam.includes('login.html')) {
        window.location.href = redirectParam;
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Perform AJAX login
async function performLogin(email, password, formEl) {
    const submitBtn = formEl ? formEl.querySelector('button[type="submit"]') : null;
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing in...';
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username: email })
        });

        const data = await response.json();

        if (data.success) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Welcome Back!',
                    text: `Signed in as ${data.user.name || 'User'}`,
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    handleLoginSuccess(data.user, data.token);
                });
            } else {
                handleLoginSuccess(data.user, data.token);
            }
        } else {
            const errorMsg = data.message || 'Invalid email or password';
            showModalLoginError(formEl, errorMsg);
        }
    } catch (error) {
        console.error('Login error:', error);
        showModalLoginError(formEl, 'An error occurred during login. Please try again.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    }
}

function showModalLoginError(formEl, msg) {
    const alertEl = document.getElementById('loginAlert') || (formEl ? formEl.querySelector('.alert') : null);
    const alertMsg = document.getElementById('loginAlertMessage');
    
    if (alertEl && alertMsg) {
        alertMsg.textContent = msg;
        alertEl.style.display = 'block';
        alertEl.classList.add('show', 'alert-danger');
    } else if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: msg
        });
    } else {
        alert(msg);
    }
}

// Auto-bind login form submit on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Only bind if not on the dedicated login.html page (which has its own script)
    if (window.location.pathname.endsWith('login.html')) return;

    const modalLoginForm = document.getElementById('loginForm');
    if (modalLoginForm) {
        modalLoginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const emailInput = document.getElementById('loginInput') || document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');

            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            if (email && password) {
                performLogin(email, password, modalLoginForm);
            }
        });
    }
});
