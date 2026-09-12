/**
 * Denla Discount - Shopping Cart & POS Manager
 * Handles cart operations with localStorage persistence and backend sync
 * Supports both guest users and authenticated users with smart cart merging
 */

const CART_STORAGE_KEY = 'awesomeTech_cart';
const WISHLIST_STORAGE_KEY = 'awesomeTech_wishlist';
const WHATSAPP_NUMBER = '+254704546916';
const API_BASE_URL = '/api';

class CartManager {
    constructor() {
        this.items = this.loadFromStorage();
        this.listeners = [];
        this.syncInProgress = false;
        this.backendAvailable = true; // Track backend availability
        
        // Initialize authentication-aware features
        this.initializeAuthFeatures();
    }

    // Initialize authentication-aware features
    initializeAuthFeatures() {
        // Listen for login events to merge carts
        window.addEventListener('userLoggedIn', () => this.handleUserLogin());
        
        // Listen for logout events to keep cart in localStorage
        window.addEventListener('userLoggedOut', () => this.handleUserLogout());
        
        // Only sync on page load if user just logged in (not on every page load)
        // This prevents unnecessary API calls when backend is down
        const justLoggedIn = sessionStorage.getItem('justLoggedIn');
        if (justLoggedIn === 'true') {
            sessionStorage.removeItem('justLoggedIn');
            if (this.isLoggedIn() && !this.syncInProgress) {
                this.syncWithBackend();
            }
        }
    }

    // Check if user is logged in
    isLoggedIn() {
        const user = this.getCurrentUser();
        const token = localStorage.getItem('token');
        return !!(user && token);
    }

    // Get current user from localStorage
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    // Get auth headers for API calls
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    // Load cart from localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    // Save cart to localStorage
    saveToStorage() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
            this.notifyListeners();
            
            // Auto-sync to backend if user is logged in
            if (this.isLoggedIn() && !this.syncInProgress) {
                this.debouncedSyncToBackend();
            }
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Debounced sync to prevent too many API calls
    debouncedSyncToBackend() {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
            this.syncCartToBackend();
        }, 1000); // Wait 1 second after last change before syncing
    }

    // Sync cart to backend for logged-in users
    async syncCartToBackend() {
        // Check if backend sync is disabled due to database errors
        if (sessionStorage.getItem('backendSyncDisabled') === 'true') {
            return;
        }
        
        if (!this.isLoggedIn() || this.syncInProgress || !this.backendAvailable) {
            return;
        }

        this.syncInProgress = true;

        try {
            const response = await fetch(`${API_BASE_URL}/cart/sync`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ items: this.items })
            });

            if (response.ok) {
                this.backendAvailable = true;
                console.log('✓ Cart synced to backend');
            } else if (response.status === 401) {
                // Token expired, handle logout
                this.handleTokenExpired();
            } else if (response.status === 404) {
                this.backendAvailable = false;
                console.info('ℹ Cart sync not available - using localStorage only');
            } else if (response.status === 500) {
                this.backendAvailable = false;
                console.warn('⚠ Backend error - cart saved locally');
            } else {
                console.warn(`⚠ Cart sync failed (${response.status}) - cart saved locally`);
            }
        } catch (error) {
            this.backendAvailable = false;
            // Only log on first failure
            if (this.items.length > 0) {
                console.info('ℹ Backend unavailable - cart saved locally');
            }
        } finally {
            this.syncInProgress = false;
        }
    }

    // Sync cart from backend when user logs in
    async syncFromBackend() {
        // Check if backend sync is disabled due to database errors
        if (sessionStorage.getItem('backendSyncDisabled') === 'true') {
            return null;
        }
        
        if (!this.isLoggedIn()) {
            return null;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/cart`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.backendAvailable = true;
                const data = await response.json();
                console.log('✓ Cart loaded from backend');
                return data.items || [];
            } else if (response.status === 401) {
                this.handleTokenExpired();
                return null;
            } else if (response.status === 404 || response.status === 500) {
                this.backendAvailable = false;
                
                // If 500 error (likely RLS policy issue), disable backend permanently for this session
                if (response.status === 500) {
                    sessionStorage.setItem('backendSyncDisabled', 'true');
                    console.warn('⚠ Backend database error detected - cart sync disabled for this session');
                }
                
                // Silent fallback - no need to log
                return null;
            } else {
                console.info(`ℹ Using localStorage (backend status: ${response.status})`);
                return null;
            }
        } catch (error) {
            this.backendAvailable = false;
            // Silent fallback - backend is down, use localStorage
            return null;
        }
    }

    // Handle user login - merge guest cart with saved cart
    async handleUserLogin() {
        console.log('User logged in, merging carts...');
        
        const guestCart = [...this.items]; // Save current guest cart
        const backendCart = await this.syncFromBackend();

        if (backendCart && backendCart.length > 0) {
            // Merge guest cart with backend cart
            this.items = this.mergeCarts(guestCart, backendCart);
            this.saveToStorage();
            
            if (guestCart.length > 0) {
                this.showNotification(
                    'Cart Updated', 
                    `Merged ${guestCart.length} guest items with your saved cart`, 
                    'info'
                );
            }
        } else {
            // No backend cart, just sync current cart to backend
            await this.syncCartToBackend();
        }
    }

    // Merge two carts intelligently
    mergeCarts(guestCart, backendCart) {
        const merged = [...backendCart];

        guestCart.forEach(guestItem => {
            const existingIndex = merged.findIndex(item => item.id === guestItem.id);
            
            if (existingIndex >= 0) {
                // Item exists in both - combine quantities
                merged[existingIndex].quantity += guestItem.quantity;
            } else {
                // Item only in guest cart - add it
                merged.push(guestItem);
            }
        });

        return merged;
    }

    // Handle user logout - keep cart in localStorage only
    handleUserLogout() {
        console.log('User logged out, cart preserved in localStorage');
        // Cart stays in localStorage, just stop backend syncing
        this.syncInProgress = false;
    }

    // Handle expired token
    handleTokenExpired() {
        // Prevent rapid repeated logout calls
        const lastLogout = sessionStorage.getItem('lastLogoutTime');
        const now = Date.now();
        
        if (lastLogout && (now - parseInt(lastLogout)) < 2000) {
            console.log('⚠ Preventing rapid logout - already logged out recently');
            return;
        }
        
        // Check if token was just set recently (< 5 seconds) - likely not actually expired
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                if (userData.loginTime && (now - userData.loginTime) < 5000) {
                    console.log('⚠ Token appears fresh - ignoring expiry (possible backend error)');
                    this.backendAvailable = false; // Disable backend sync instead
                    return;
                }
            } catch (e) {
                // Continue with logout
            }
        }
        
        console.log('Token expired - logging out');
        sessionStorage.setItem('lastLogoutTime', now.toString());
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Dispatch logout event
        window.dispatchEvent(new Event('userLoggedOut'));
    }

    // Sync cart with backend (called on login or page load for logged-in users)
    async syncWithBackend() {
        const backendCart = await this.syncFromBackend();
        
        if (backendCart) {
            const localCart = [...this.items];
            
            // If local cart has items, merge them
            if (localCart.length > 0) {
                this.items = this.mergeCarts(localCart, backendCart);
                this.saveToStorage();
            } else {
                // No local items, just use backend cart
                this.items = backendCart;
                this.saveToStorage();
            }
        }
    }

    // Add listener for cart changes
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.items));
        this.updateCartBadge();
    }

    // Update cart count badge in header
    updateCartBadge() {
        const count = this.getTotalItems();
        const badges = document.querySelectorAll('[id*="cartCount"], [id*="CartCount"]');
        badges.forEach(badge => {
            badge.textContent = count;
        });
    }

    // Get total number of items
    getTotalItems() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Get cart items
    getItems() {
        return [...this.items];
    }

    // Find item by ID
    findItem(productId) {
        return this.items.find(item => item.id === productId);
    }

    // Add item to cart
    addItem(product, quantity = 1) {
        const existingItem = this.findItem(product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
            this.showNotification('Updated cart', `${product.name} quantity increased`);
        } else {
            // Handle images array or single image
            let productImage = 'img/product-1.png';
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                productImage = product.images[0];
            } else if (product.image_url) {
                productImage = product.image_url;
            } else if (product.image) {
                productImage = product.image;
            }
            
            this.items.push({
                id: product.id,
                name: product.name,
                brand: product.brand || 'Unknown',
                price: product.price,
                oldPrice: product.old_price || product.oldPrice || null,
                image: productImage,
                images: product.images || [productImage],
                description: product.description || product.short_description || '',
                category_name: product.category_name || product.category || '',
                condition: product.condition || 'new',
                stock_quantity: product.stock_quantity || null,
                specs: product.specs || {},
                quantity: quantity
            });
            this.showNotification('Added to cart', `${product.name} added successfully`);
        }

        this.saveToStorage();
        this.updateCartBadge();
        return true;
    }

    // Add to cart by product ID (fetches product from cache or API)
    async addToCart(productId, quantity = 1) {
        try {
            // Try to get product from global cache first
            let product = window._productCache && window._productCache[productId];
            
            if (!product) {
                // Fetch from API
                const response = await fetch(`${API_BASE_URL}/products/${productId}`);
                if (!response.ok) {
                    this.showNotification('Error', 'Product not found', 'error');
                    return false;
                }
                const data = await response.json();
                product = data.product || data;
                
                // Cache it
                if (!window._productCache) window._productCache = {};
                window._productCache[productId] = product;
            }
            
            return this.addItem(product, quantity);
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Error', 'Failed to add product to cart', 'error');
            return false;
        }
    }

    // Update item quantity
    updateQuantity(productId, newQuantity) {
        if (newQuantity < 1) {
            return this.removeItem(productId);
        }

        const item = this.findItem(productId);
        if (item) {
            item.quantity = newQuantity;
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Remove item from cart
    removeItem(productId) {
        const initialLength = this.items.length;
        this.items = this.items.filter(item => item.id !== productId);
        
        if (this.items.length < initialLength) {
            this.saveToStorage();
            this.showNotification('Removed from cart', 'Item removed successfully');
            return true;
        }
        return false;
    }

    // Clear entire cart
    clearCart() {
        this.items = [];
        this.saveToStorage();
        this.showNotification('Cart cleared', 'All items removed');
    }

    // ===== WISHLIST MANAGEMENT =====
    
    // Load wishlist from localStorage
    loadWishlistFromStorage() {
        try {
            const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading wishlist:', error);
            return [];
        }
    }

    // Save wishlist to localStorage
    saveWishlistToStorage(items) {
        try {
            localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
            
            // Auto-sync to backend if user is logged in
            if (this.isLoggedIn() && !this.syncInProgress) {
                this.syncWishlistToBackend(items);
            }
        } catch (error) {
            console.error('Error saving wishlist:', error);
        }
    }

    // Get wishlist items
    getWishlist() {
        return this.loadWishlistFromStorage();
    }

    // Add item to wishlist
    addToWishlist(product) {
        const wishlist = this.loadWishlistFromStorage();
        const exists = wishlist.find(item => item.id === product.id);

        if (exists) {
            this.showNotification('Already in Wishlist', `${product.name} is already in your wishlist`, 'info');
            return false;
        }

        // Handle images array or single image
        let productImage = 'img/product-1.png';
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            productImage = product.images[0];
        } else if (product.image_url) {
            productImage = product.image_url;
        } else if (product.image) {
            productImage = product.image;
        }

        wishlist.push({
            id: product.id,
            name: product.name,
            brand: product.brand || 'Unknown',
            price: product.price,
            oldPrice: product.old_price || product.oldPrice || null,
            image: productImage,
            images: product.images || [productImage],
            description: product.description || product.short_description || '',
            category_name: product.category_name || product.category || '',
            condition: product.condition || 'new',
            stock_quantity: product.stock_quantity || null,
            specs: product.specs || {}
        });

        this.saveWishlistToStorage(wishlist);
        this.showNotification('Added to Wishlist', `${product.name} added successfully`);
        return true;
    }

    // Remove item from wishlist
    removeFromWishlist(productId) {
        let wishlist = this.loadWishlistFromStorage();
        const initialLength = wishlist.length;
        
        wishlist = wishlist.filter(item => item.id !== productId);
        
        if (wishlist.length < initialLength) {
            this.saveWishlistToStorage(wishlist);
            this.showNotification('Removed from Wishlist', 'Item removed successfully');
            return true;
        }
        return false;
    }

    // Move item from wishlist to cart
    moveWishlistToCart(productId) {
        const wishlist = this.loadWishlistFromStorage();
        const item = wishlist.find(i => i.id === productId);

        if (item) {
            this.addItem(item, 1);
            this.removeFromWishlist(productId);
            return true;
        }
        return false;
    }

    // Sync wishlist to backend
    async syncWishlistToBackend(items) {
        if (!this.isLoggedIn() || !this.backendAvailable) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/wishlist/sync`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ items })
            });
            
            if (response.ok) {
                console.log('✓ Wishlist synced to backend');
            }
            // Silent fail for other statuses - wishlist saved locally
        } catch (error) {
            // Silent fail - wishlist works locally
        }
    }

    // Calculate cart totals
    calculateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const discount = this.items.reduce((sum, item) => {
            if (item.oldPrice && item.oldPrice > item.price) {
                return sum + ((item.oldPrice - item.price) * item.quantity);
            }
            return sum;
        }, 0);

        const delivery = 0; // Free delivery
        const total = subtotal + delivery;

        return { subtotal, discount, delivery, total, savings: discount };
    }

    // Generate WhatsApp order message
    generateWhatsAppMessage() {
        if (this.items.length === 0) {
            return null;
        }

        const { subtotal, discount, total } = this.calculateTotals();
        
        let message = "Hello! I would like to order the following items:\n\n";
        
        // List all items
        this.items.forEach((item, index) => {
            message += `${index + 1}. *${item.quantity}x ${item.name}*\n`;
            message += `   Brand: ${item.brand}\n`;
            
            if (item.specs && Object.keys(item.specs).length > 0) {
                const specs = [];
                if (item.specs.processor) specs.push(item.specs.processor);
                if (item.specs.ram) specs.push(item.specs.ram);
                if (item.specs.storage) specs.push(item.specs.storage);
                if (specs.length > 0) {
                    message += `   Specs: ${specs.join(', ')}\n`;
                }
            }
            
            message += `   Price: KSh ${(item.price * item.quantity).toLocaleString()}\n`;
            
            if (item.oldPrice && item.oldPrice > item.price) {
                const saved = (item.oldPrice - item.price) * item.quantity;
                message += `   (Save: KSh ${saved.toLocaleString()})\n`;
            }
            
            message += "\n";
        });

        // Add summary
        message += "━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        message += `📦 Subtotal: KSh ${subtotal.toLocaleString()}\n`;
        
        if (discount > 0) {
            message += `🎉 Discount: -KSh ${discount.toLocaleString()}\n`;
        }
        
        message += `🚚 Delivery: FREE\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `💰 *TOTAL: KSh ${total.toLocaleString()}*\n\n`;
        
        if (discount > 0) {
            message += `✨ You save KSh ${discount.toLocaleString()}!\n\n`;
        }
        
        message += "Please confirm availability and estimated delivery time. Thank you! 😊";

        return message;
    }

    // Open WhatsApp with order details
    checkoutViaWhatsApp() {
        const message = this.generateWhatsAppMessage();
        
        if (!message) {
            this.showNotification('Cart is empty', 'Please add items to your cart first', 'warning');
            return false;
        }

        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
        
        // Open WhatsApp
        window.open(whatsappURL, '_blank');
        
        this.showNotification('Opening WhatsApp', 'Your order is ready to send!', 'success');
        return true;
    }

    // Show notification
    showNotification(title, message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px 25px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            z-index: 99999;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;

        const iconColor = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        }[type] || '#28a745';

        const icon = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        }[type] || 'fa-check-circle';

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <i class="fas ${icon}" style="color: ${iconColor}; font-size: 2rem;"></i>
                <div>
                    <strong style="display: block; margin-bottom: 5px; color: #333;">${title}</strong>
                    <span style="color: #666; font-size: 0.9rem;">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 1.2rem;
                ">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Get mini cart HTML for dropdown
    getMiniCartHTML() {
        if (this.items.length === 0) {
            return `
                <div style="padding: 30px; text-align: center;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                    <p style="color: #999;">Your cart is empty</p>
                    <a href="shop-new.html" class="btn btn-primary btn-sm">Start Shopping</a>
                </div>
            `;
        }

        const { total } = this.calculateTotals();
        
        let html = '<div style="max-height: 400px; overflow-y: auto;">';
        
        this.items.slice(0, 3).forEach(item => {
            html += `
                <div style="display: flex; gap: 10px; padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 5px; background: #f8f9fa;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 5px;">${item.name.substring(0, 40)}...</div>
                        <div style="color: #999; font-size: 0.8rem;">${item.quantity}x KSh ${item.price.toLocaleString()}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        if (this.items.length > 3) {
            html += `<div style="padding: 10px; text-align: center; color: #999; font-size: 0.9rem;">+${this.items.length - 3} more items</div>`;
        }
        
        html += `
            <div style="padding: 15px; border-top: 2px solid #f0f0f0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: 700; font-size: 1.1rem;">
                    <span>Total:</span>
                    <span style="color: var(--bs-primary);">KSh ${total.toLocaleString()}</span>
                </div>
                <a href="cart-new.html" class="btn btn-primary w-100">View Cart</a>
            </div>
        `;
        
        return html;
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Create global cart instance
window.cartManager = new CartManager();

// Wishlist Manager Class
class WishlistManager {
    constructor() {
        this.items = [];
        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('wishlist');
            this.items = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading wishlist:', error);
            this.items = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('wishlist', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving wishlist:', error);
        }
    }

    addItem(product) {
        const exists = this.items.find(item => item.id === product.id);
        if (exists) {
            window.cartManager.showNotification('Already in wishlist', `${product.name} is already saved`, 'info');
            return false;
        }

        // Handle images
        let productImage = 'img/product-1.png';
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            productImage = product.images[0];
        } else if (product.image_url) {
            productImage = product.image_url;
        } else if (product.image) {
            productImage = product.image;
        }

        this.items.push({
            id: product.id,
            name: product.name,
            brand: product.brand || 'Unknown',
            price: product.price,
            oldPrice: product.old_price || product.oldPrice || null,
            image: productImage,
            images: product.images || [productImage],
            description: product.description || '',
            category_name: product.category_name || product.category || '',
            condition: product.condition || 'new',
            addedDate: new Date().toISOString()
        });

        this.saveToStorage();
        window.cartManager.showNotification('Added to wishlist', `${product.name} saved for later`, 'success');
        return true;
    }

    async addToWishlist(productId) {
        try {
            // Try to get product from global cache first
            let product = window._productCache && window._productCache[productId];
            
            if (!product) {
                // Fetch from API
                const response = await fetch(`${API_BASE_URL}/products/${productId}`);
                if (!response.ok) {
                    window.cartManager.showNotification('Error', 'Product not found', 'error');
                    return false;
                }
                const data = await response.json();
                product = data.product || data;
                
                // Cache it
                if (!window._productCache) window._productCache = {};
                window._productCache[productId] = product;
            }
            
            return this.addItem(product);
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            window.cartManager.showNotification('Error', 'Failed to add to wishlist', 'error');
            return false;
        }
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        window.cartManager.showNotification('Removed', 'Item removed from wishlist', 'info');
    }

    moveToCart(productId) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            window.cartManager.addItem(item, 1);
            this.removeItem(productId);
        }
    }

    getItems() {
        return this.items;
    }

    getCount() {
        return this.items.length;
    }
}

// Create global wishlist instance
window.wishlistManager = new WishlistManager();

// Initialize cart badge on page load
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager.updateCartBadge();
});
