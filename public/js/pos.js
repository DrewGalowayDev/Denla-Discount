// POS System JavaScript
const API_URL = 'http://localhost:5000/api';
let products = [];
let cart = [];
let selectedPaymentMethod = 'cash';
let currentCustomer = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadProducts();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) {
        document.getElementById('cashierName').textContent = user.name;
    }
}

// Load products from API
async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load products');

        const data = await response.json();
        products = data.products || [];
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products');
        document.getElementById('productsGrid').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> 
                Failed to load products. Please refresh the page.
            </div>
        `;
    }
}

// Display products in grid
function displayProducts(productsToDisplay) {
    const grid = document.getElementById('productsGrid');
    
    if (productsToDisplay.length === 0) {
        grid.innerHTML = `
            <div class="text-center p-5">
                <i class="fas fa-box-open" style="font-size: 48px; color: #ccc;"></i>
                <p class="mt-3 text-muted">No products found</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = productsToDisplay.map(product => `
        <div class="product-card" onclick="addToCart('${product.id}')">
            <div class="product-name">${product.name}</div>
            <div class="product-sku">SKU: ${product.sku} | Barcode: ${product.barcode || 'N/A'}</div>
            <div class="product-price">KSh ${formatNumber(product.selling_price)}</div>
            <div class="product-stock ${getStockClass(product.current_stock)}">
                <i class="fas fa-box"></i> Stock: ${product.current_stock} ${product.unit_of_measure}
            </div>
        </div>
    `).join('');
}

// Get stock class for styling
function getStockClass(stock) {
    if (stock <= 0) return 'out';
    if (stock <= 10) return 'low';
    return '';
}

// Search products
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        displayProducts(products);
        return;
    }

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.sku.toLowerCase().includes(searchTerm) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm))
    );

    displayProducts(filtered);
}

// Filter by category
function filterCategory(category) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    if (category === 'all') {
        displayProducts(products);
        return;
    }

    const filtered = products.filter(p => p.category_name === category);
    displayProducts(filtered);
}

// Scan barcode (placeholder for actual scanner integration)
function scanBarcode() {
    const barcode = prompt('Enter or scan barcode:');
    if (barcode) {
        const product = products.find(p => p.barcode === barcode);
        if (product) {
            addToCart(product.id);
        } else {
            showError('Product not found');
        }
    }
}

// Add product to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check stock
    const currentQty = cart.find(item => item.id === productId)?.quantity || 0;
    if (currentQty >= product.current_stock) {
        showError('Insufficient stock');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            price: parseFloat(product.selling_price),
            cost_price: parseFloat(product.cost_price),
            quantity: 1,
            tax_rate: parseFloat(product.tax_rate) || 16
        });
    }

    updateCart();
}

// Update cart display
function updateCart() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Cart is empty</p>
                <small>Search or scan products to add them</small>
            </div>
        `;
        cartCount.textContent = '0';
        document.getElementById('btnCheckout').disabled = true;
    } else {
        cartItemsDiv.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">KSh ${formatNumber(item.price)} each</div>
                </div>
                <div class="item-quantity">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <div class="item-total">KSh ${formatNumber(item.price * item.quantity)}</div>
                <span class="remove-item" onclick="removeItem(${index})">
                    <i class="fas fa-times"></i>
                </span>
            </div>
        `).join('');
        
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        document.getElementById('btnCheckout').disabled = false;
    }

    updateSummary();
}

// Update item quantity
function updateQuantity(index, change) {
    const item = cart[index];
    const product = products.find(p => p.id === item.id);
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeItem(index);
        return;
    }

    if (newQuantity > product.current_stock) {
        showError('Insufficient stock');
        return;
    }

    item.quantity = newQuantity;
    updateCart();
}

// Remove item from cart
function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

// Update cart summary
function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * 0.16; // 16% VAT
    const discount = 0; // TODO: Implement discount logic
    const total = subtotal + taxAmount - discount;

    document.getElementById('subtotal').textContent = 'KSh ' + formatNumber(subtotal);
    document.getElementById('tax').textContent = 'KSh ' + formatNumber(taxAmount);
    document.getElementById('discount').textContent = 'KSh ' + formatNumber(discount);
    document.getElementById('total').textContent = 'KSh ' + formatNumber(total);
}

// Clear cart
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear the cart?')) {
        cart = [];
        updateCart();
    }
}

// Checkout
function checkout() {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.16;
    document.getElementById('paymentTotal').textContent = 'KSh ' + formatNumber(total);
    
    const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    paymentModal.show();
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update active state
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector(`.payment-method[data-method="${method}"]`).classList.add('active');

    // Show/hide sections
    document.getElementById('cashPaymentSection').style.display = method === 'cash' ? 'block' : 'none';
    document.getElementById('mpesaPaymentSection').style.display = method === 'mpesa' ? 'block' : 'none';
}

// Calculate change
function calculateChange() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.16;
    const received = parseFloat(document.getElementById('amountReceived').value) || 0;
    const change = received - total;

    if (received > 0) {
        document.getElementById('changeDisplay').style.display = 'block';
        document.getElementById('changeAmount').textContent = 'KSh ' + formatNumber(Math.max(0, change));
    } else {
        document.getElementById('changeDisplay').style.display = 'none';
    }
}

// Complete payment
async function completePayment() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.16;
    
    // Validate payment
    if (selectedPaymentMethod === 'cash') {
        const received = parseFloat(document.getElementById('amountReceived').value) || 0;
        if (received < total) {
            showError('Amount received is less than total');
            return;
        }
    }

    if (selectedPaymentMethod === 'mpesa') {
        const phone = document.getElementById('mpesaPhone').value;
        if (!phone) {
            showError('Please enter M-Pesa phone number');
            return;
        }
    }

    // Prepare sale data
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * 0.16;
    
    const saleData = {
        customer_id: currentCustomer?.id || null,
        payment_method: selectedPaymentMethod,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: total,
        amount_paid: selectedPaymentMethod === 'cash' ? parseFloat(document.getElementById('amountReceived').value) : total,
        change_given: selectedPaymentMethod === 'cash' ? Math.max(0, parseFloat(document.getElementById('amountReceived').value) - total) : 0,
        items: cart.map(item => ({
            product_id: item.id,
            product_name: item.name,
            sku: item.sku,
            barcode: item.barcode,
            quantity: item.quantity,
            unit_price: item.price,
            cost_price: item.cost_price,
            discount_amount: 0,
            tax_amount: (item.price * item.quantity * 0.16),
            subtotal: item.price * item.quantity * 1.16
        }))
    };

    try {
        // Show loading
        const btn = event.target;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(saleData)
        });

        if (!response.ok) throw new Error('Payment failed');

        const result = await response.json();
        
        // Close payment modal
        bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();

        // Show success modal
        document.getElementById('saleNumber').textContent = result.sale_number || result.sale?.sale_number;
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();

        // Clear cart
        cart = [];
        updateCart();

    } catch (error) {
        console.error('Payment error:', error);
        showError('Payment failed. Please try again.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Complete Payment';
    }
}

// New sale
function newSale() {
    bootstrap.Modal.getInstance(document.getElementById('successModal')).hide();
    cart = [];
    currentCustomer = null;
    document.getElementById('selectedCustomer').textContent = 'Walk-in Customer';
    document.getElementById('searchInput').value = '';
    document.getElementById('amountReceived').value = '';
    updateCart();
    loadProducts();
}

// Select customer
function selectCustomer() {
    // TODO: Implement customer selection
    alert('Customer selection feature coming soon!');
}

// Print receipt
function printReceipt() {
    // TODO: Implement receipt printing
    window.print();
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Utility: Format number
function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Utility: Show error
function showError(message) {
    alert(message); // TODO: Implement better toast notification
}
