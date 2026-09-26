// Auth Debug Script - Add this to admin-dashboard.html to debug auth issues

(function() {
    console.log('=== AUTH DEBUG START ===');
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('Token exists:', !!token);
    console.log('Token length:', token ? token.length : 0);
    console.log('User exists:', !!userStr);
    
    if (token) {
        try {
            // Decode JWT (without verification - just to see payload)
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                console.log('Token payload:', payload);
                console.log('Token issued at (iat):', new Date(payload.iat * 1000));
                console.log('Token expires at (exp):', new Date(payload.exp * 1000));
                console.log('Current time:', new Date());
                console.log('Is token expired?', payload.exp * 1000 < Date.now());
                
                const timeLeft = Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60);
                console.log('Time left (minutes):', timeLeft);
            }
        } catch (e) {
            console.error('Failed to decode token:', e);
        }
    }
    
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            console.log('User object:', user);
            console.log('User role:', user.role);
        } catch (e) {
            console.error('Failed to parse user:', e);
        }
    }
    
    console.log('=== AUTH DEBUG END ===');
})();
