/**
 * Admin Products Management Module
 * Handles product CRUD operations with real-time database integration
 */

let productsData = [];
let productsTable = null;
let categoriesData = [];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert File to Base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 string of the file
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

// ============================================
// LOAD PRODUCTS FROM DATABASE
// ============================================

async function loadProducts() {
    try {
        showSpinner(true);

        // Fetch from backend API
        const data = await apiRequest('/products');

        if (data.success && data.products) {
            productsData = data.products.map(product => ({
                id: product.id,
                name: product.name,
                brand: product.brand || 'N/A',
                price: parseFloat(product.price),
                oldPrice: product.old_price ? parseFloat(product.old_price) : null,
                stock: parseInt(product.stock),
                category: product.category_id,
                condition: product.condition,
                image: product.images && product.images.length > 0 ? product.images[0] : 'img/product-1.png',
                featured: product.is_featured,
                slug: product.slug,
                description: product.description,
                specifications: product.specifications
            }));

            renderProductsTable();
            showToast('success', `Loaded ${productsData.length} products`);
        } else {
            productsData = [];
            renderProductsTable();
        }

        showSpinner(false);
    } catch (error) {
        console.error('Error loading products:', error);
        showAPIError(error);
        productsData = [];
        renderProductsTable();
        showSpinner(false);
    }
}

// ============================================
// LOAD CATEGORIES FOR DROPDOWNS
// ============================================

async function loadCategoriesForProducts() {
    try {
        const data = await apiRequest('/categories');
        if (data.success && data.categories) {
            categoriesData = data.categories;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// ============================================
// RENDER PRODUCTS TABLE
// ============================================

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (productsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="fas fa-box fa-3x text-muted mb-3 d-block"></i>
                    <p class="text-muted">No products found</p>
                    <button class="btn btn-primary" onclick="showAddProductModal()">
                        <i class="fas fa-plus me-2"></i>Add Your First Product
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = productsData.map(product => `
        <tr data-product-id="${product.id}">
            <td>
                <input type="checkbox" class="product-checkbox" value="${product.id}">
            </td>
            <td>
                <img src="${product.image}" alt="${product.name}" class="product-img" 
                     onerror="this.src='img/product-1.png'">
            </td>
            <td>
                <strong>${product.name}</strong>
                ${product.featured ? '<span class="badge bg-warning ms-2">Featured</span>' : ''}
            </td>
            <td>${product.brand}</td>
            <td>
                <strong>${formatCurrency(product.price)}</strong>
                ${product.oldPrice ? `<br><del class="text-muted small">${formatCurrency(product.oldPrice)}</del>` : ''}
            </td>
            <td>
                <span class="badge ${getStockBadgeClass(product.stock)}">${product.stock}</span>
            </td>
            <td>
                <span class="status-badge ${product.condition}">${product.condition}</span>
            </td>
            <td>
                <button type="button" class="action-btn edit" data-action="edit" data-id="${product.id}" onclick="editProduct('${product.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="action-btn view" data-action="view" data-id="${product.id}" onclick="viewProduct('${product.id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="action-btn delete" data-action="delete" data-id="${product.id}" onclick="deleteProduct('${product.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                <button type="button" class="action-btn" data-action="whatsapp" data-id="${product.id}" onclick="sendProductWhatsApp('${product.id}')" title="Share via WhatsApp">
                    <i class="fab fa-whatsapp text-success"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Initialize select all checkbox
    initSelectAll();
}

// Get stock badge class
function getStockBadgeClass(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock < 10) return 'low-stock';
    return 'in-stock';
}

// ============================================
// ADD PRODUCT
// ============================================

function showAddProductModal() {
    const modalEl = document.getElementById('addProductModal');
    if (!modalEl) {
        console.error('Modal #addProductModal not found');
        return;
    }
    const form = document.getElementById('addProductForm');
    if (form) form.reset();

    // Populate category dropdown
    populateCategoryDropdown('addProductForm');

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

function populateCategoryDropdown(formId) {
    const select = document.querySelector(`#${formId} select[name="category"]`);
    if (select && categoriesData && categoriesData.length > 0) {
        select.innerHTML = '<option value="">Select category...</option>' +
            categoriesData.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
}

async function saveProduct() {
    console.log('saveProduct() called'); // Debug log
    
    const form = document.getElementById('addProductForm');
    if (!form) {
        console.error('Form not found!');
        return;
    }
    
    if (!form.checkValidity()) {
        console.log('Form validation failed');
        form.reportValidity();
        return;
    }
    
    console.log('Form is valid, processing...');

    const formData = new FormData(form);
    
    // Handle image upload
    const imageFile = formData.get('image');
    let imageUrl = 'img/product-1.png';
    
    if (imageFile && imageFile.size > 0) {
        try {
            // Convert image to base64 for storage
            imageUrl = await fileToBase64(imageFile);
        } catch (error) {
            console.error('Error converting image:', error);
            showToast('error', 'Failed to process image');
            return;
        }
    }
    
    const productData = {
        name: formData.get('name'),
        slug: formData.get('name').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        brand: formData.get('brand') || '',
        price: parseFloat(formData.get('price')),
        old_price: formData.get('oldPrice') ? parseFloat(formData.get('oldPrice')) : null,
        stock: parseInt(formData.get('stock')) || 0,
        category_id: formData.get('category') || null,
        condition: formData.get('condition') || 'Standard / Fresh Pack',
        spec: formData.get('spec') || '',
        sku: formData.get('sku') || '',
        description: formData.get('description') || '',
        is_featured: formData.get('featured') === 'on',
        is_new_arrival: formData.get('newArrival') === 'on',
        is_deal: formData.get('deal') === 'on',
        images: [imageUrl],
        specifications: {
            unit_size: formData.get('spec') || '',
            barcode_sku: formData.get('sku') || '',
            grade: formData.get('condition') || 'Standard / Fresh Pack'
        }
    };

    console.log('Sending product data:', JSON.stringify(productData, null, 2));

    // Show loading state on save button
    const saveBtn = document.querySelector('#addProductModal .btn-primary');
    const originalBtnText = saveBtn ? saveBtn.innerHTML : 'Save Product';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
    }

    try {
        const response = await apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });

        console.log('Server response:', response);

        if (response.success || response.product) {
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            if (modal) modal.hide();
            
            // Reset the form
            form.reset();
            
            // Show success notification
            Swal.fire({
                icon: 'success',
                title: 'Grocery Item Added!',
                text: `"${productData.name}" has been added to the store.`,
                timer: 2500,
                showConfirmButton: false,
                timerProgressBar: true
            });
            
            // Reload products table
            await loadProducts();
        } else {
            // Handle unexpected response
            Swal.fire({
                icon: 'warning',
                title: 'Unexpected Response',
                text: response.error || 'Product may have been added. Please refresh to check.',
                confirmButtonColor: '#FF6B35'
            });
        }
    } catch (error) {
        console.error('Error saving product:', error);
        Swal.fire({
            icon: 'error',
            title: 'Failed to Add Product',
            text: error.message || 'Please try again.',
            confirmButtonColor: '#d33'
        });
    } finally {
        // Restore button state
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnText;
        }
    }
}

// ============================================
// EDIT PRODUCT
// ============================================

function editProduct(productId) {
    const product = productsData.find(p => String(p.id) === String(productId));
    if (!product) {
        console.warn('Product not found for edit:', productId);
        return;
    }

    const currentImage = product.image || 'img/product-1.png';

    Swal.fire({
        title: 'Edit Store Item',
        html: `
            <form id="editProductForm" class="text-start">

                <!-- Product Photo Section -->
                <div class="mb-3">
                    <label class="form-label small fw-bold">Product Photo</label>
                    <div class="d-flex align-items-center gap-3">
                        <div style="position:relative; width:90px; height:90px; flex-shrink:0;">
                            <img id="editImagePreview"
                                 src="${currentImage}"
                                 alt="Product Image"
                                 onerror="this.src='img/product-1.png'"
                                 style="width:90px;height:90px;object-fit:cover;border-radius:10px;border:2px solid #dee2e6;cursor:pointer;"
                                 onclick="document.getElementById('editImageInput').click()"
                                 title="Click to change photo">
                            <span style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.55);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer;" onclick="document.getElementById('editImageInput').click()">
                                <i class="fas fa-camera"></i>
                            </span>
                        </div>
                        <div style="flex:1;">
                            <input type="file" id="editImageInput" accept="image/*" class="form-control form-control-sm"
                                   onchange="
                                       const f = this.files[0];
                                       if (f) {
                                           const r = new FileReader();
                                           r.onload = e => document.getElementById('editImagePreview').src = e.target.result;
                                           r.readAsDataURL(f);
                                       }
                                   ">
                            <div class="form-text mt-1"><i class="fas fa-info-circle text-muted me-1"></i>Click the image or browse to replace it. Leave blank to keep current photo.</div>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-bold">Item Name &amp; Details</label>
                    <input type="text" class="form-control" value="${product.name || ''}" id="editName" required>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">Brand / Producer</label>
                        <input type="text" class="form-control" value="${product.brand || ''}" id="editBrand" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">Unit / Packaging Size</label>
                        <input type="text" class="form-control" value="${product.spec || (product.specifications && product.specifications.unit_size) || ''}" id="editSpec" placeholder="e.g. 2 Litres / 1 Kg">
                    </div>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">Price (KSh)</label>
                        <input type="number" class="form-control" value="${product.price || 0}" id="editPrice" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">Stock Quantity</label>
                        <input type="number" class="form-control" value="${product.stock || 0}" id="editStock" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">Product &amp; Storage Description</label>
                    <textarea class="form-control" id="editDescription" rows="3">${product.description || ''}</textarea>
                </div>
            </form>
        `,
        width: 680,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save me-1"></i> Save Changes',
        confirmButtonColor: '#FF6B35',
        cancelButtonText: 'Cancel',
        preConfirm: async () => {
            // Handle image: check if a new file was selected
            let imageUrl = currentImage;
            const imageInput = document.getElementById('editImageInput');
            if (imageInput && imageInput.files && imageInput.files[0]) {
                try {
                    imageUrl = await fileToBase64(imageInput.files[0]);
                } catch (err) {
                    Swal.showValidationMessage('Failed to process image. Please try again.');
                    return false;
                }
            }

            const updatedData = {
                name: document.getElementById('editName').value,
                slug: document.getElementById('editName').value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
                brand: document.getElementById('editBrand').value,
                spec: document.getElementById('editSpec').value,
                price: parseFloat(document.getElementById('editPrice').value),
                stock: parseInt(document.getElementById('editStock').value),
                description: document.getElementById('editDescription').value,
                images: [imageUrl]
            };

            try {
                const response = await apiRequest(`/products/${productId}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedData)
                });

                if (response.success) {
                    await loadProducts();
                    showToast('success', 'Product updated successfully!');
                } else {
                    Swal.showValidationMessage(response.error || 'Update failed. Please try again.');
                    return false;
                }
            } catch (error) {
                Swal.showValidationMessage(`Error: ${error.message}`);
                return false;
            }
        }
    });
}

// ============================================
// VIEW PRODUCT
// ============================================

function viewProduct(productId) {
    const product = productsData.find(p => String(p.id) === String(productId));
    if (!product) {
        console.warn('Product not found for view:', productId);
        return;
    }

    const categoryName = categoriesData.find(c => c.id === product.category)?.name || product.category || 'General';
    const unitSpec = product.spec || (product.specifications && product.specifications.unit_size) || 'Standard Pack';

    Swal.fire({
        title: product.name,
        html: `
            <div class="text-start">
                <img src="${product.image || 'img/product-1.png'}" alt="${product.name}" class="img-fluid mb-3 rounded shadow-sm d-block mx-auto" 
                     style="max-height: 200px; object-fit: cover;" onerror="this.src='img/product-1.png'">
                <p class="mb-2"><strong>Brand:</strong> ${product.brand || 'N/A'}</p>
                <p class="mb-2"><strong>Packaging / Unit:</strong> <span class="badge bg-primary">${unitSpec}</span></p>
                <p class="mb-2"><strong>Price:</strong> <span class="text-success fw-bold">${formatCurrency(product.price)}</span></p>
                ${product.oldPrice ? `<p class="mb-2"><strong>Old Price:</strong> <del class="text-muted">${formatCurrency(product.oldPrice)}</del></p>` : ''}
                <p class="mb-2"><strong>Stock Available:</strong> ${product.stock} units</p>
                <p class="mb-2"><strong>Category:</strong> ${categoryName}</p>
                ${product.description ? `<p class="mb-2"><strong>Storage & Notes:</strong> ${product.description}</p>` : ''}
                <div class="d-flex gap-2 mt-3">
                    ${product.featured ? '<span class="badge bg-warning text-dark"><i class="fas fa-star me-1"></i>Featured</span>' : ''}
                    ${product.newArrival ? '<span class="badge bg-success"><i class="fas fa-sparkles me-1"></i>New Fresh</span>' : ''}
                    ${product.deal ? '<span class="badge bg-danger"><i class="fas fa-fire me-1"></i>On Offer</span>' : ''}
                </div>
            </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: 600
    });
}

// ============================================
// DELETE PRODUCT
// ============================================

function deleteProduct(productId) {
    const product = productsData.find(p => String(p.id) === String(productId));
    if (!product) {
        console.warn('Product not found for delete:', productId);
        return;
    }

    Swal.fire({
        title: 'Delete Product',
        text: `Are you sure you want to delete "${product.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        confirmButtonColor: '#dc3545',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await apiRequest(`/products/${productId}`, {
                    method: 'DELETE'
                });

                if (response.success) {
                    await loadProducts();
                    showToast('success', 'Product deleted successfully!');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                showAPIError(error);
            }
        }
    });
}

// ============================================
// WHATSAPP SHARE
// ============================================

function sendProductWhatsApp(productId) {
    const product = productsData.find(p => String(p.id) === String(productId));
    if (!product) {
        console.warn('Product not found for WhatsApp:', productId);
        return;
    }

    Swal.fire({
        title: 'Share Product',
        html: `
            <div class="text-start">
                <p class="mb-3">Send ${product.name} via WhatsApp</p>
                <label class="form-label">Customer Phone</label>
                <input type="tel" class="form-control" id="customerPhone" placeholder="+254 7XX XXX XXX">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Send via WhatsApp',
        confirmButtonColor: '#25D366',
        preConfirm: () => {
            const phone = document.getElementById('customerPhone').value;
            if (!phone) {
                Swal.showValidationMessage('Please enter phone number');
                return false;
            }

            const discount = product.oldPrice ? product.oldPrice - product.price : 0;
            const message = `Hello! Check out this product:\n\n*${product.name}*\nBrand: ${product.brand}\nPrice: ${formatCurrency(product.price)}\n${product.oldPrice ? `Save ${formatCurrency(discount)}!` : ''}\n\nStock: ${product.stock} units available\n\nOrder now! 😊`;

            const whatsappURL = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        }
    });
}

// ============================================
// EXPORT PRODUCTS
// ============================================

function exportProducts() {
    showToast('info', 'Exporting products...');

    // Create CSV content
    const headers = ['ID', 'Name', 'Brand', 'Price', 'Stock', 'Condition'];
    const rows = productsData.map(p => [
        p.id, p.name, p.brand, p.price, p.stock, p.condition
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    showToast('success', 'Products exported successfully!');
}

// ============================================
// SELECT ALL FUNCTIONALITY
// ============================================

function initSelectAll() {
    const selectAll = document.getElementById('selectAll');
    if (!selectAll) return;

    selectAll.addEventListener('change', (e) => {
        document.querySelectorAll('.product-checkbox').forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });
}

// ============================================
// SEARCH & FILTER
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase();
                const filtered = productsData.filter(p =>
                    p.name.toLowerCase().includes(query) ||
                    p.brand.toLowerCase().includes(query)
                );

                const tempData = productsData;
                productsData = filtered;
                renderProductsTable();
                productsData = tempData;
            }, 300);
        });
    }

    const filterSelect = document.getElementById('productFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', async (e) => {
            const category = e.target.value;
            if (!category) {
                await loadProducts();
                return;
            }

            try {
                const data = await apiRequest(`/products/category/${category}`);
                if (data.success && data.products) {
                    const tempData = productsData;
                    productsData = data.products.map(product => ({
                        id: product.id,
                        name: product.name,
                        brand: product.brand || 'N/A',
                        price: parseFloat(product.price),
                        oldPrice: product.old_price ? parseFloat(product.old_price) : null,
                        stock: parseInt(product.stock),
                        category: product.category_id,
                        condition: product.condition,
                        image: product.images && product.images.length > 0 ? product.images[0] : 'img/product-1.png',
                        featured: product.is_featured
                    }));
                    renderProductsTable();
                }
            } catch (error) {
                console.error('Error filtering products:', error);
                showAPIError(error);
            }
        });
    }

    // Load categories for filter dropdown
    loadCategoriesForProducts();
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showSpinner(show) {
    const spinner = document.getElementById('productsSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

// ============================================
// EVENT DELEGATION FOR TABLE ACTION BUTTONS
// Handles clicks on dynamically rendered table rows reliably
// ============================================

function initProductTableDelegation() {
    if (window._productTableDelegationInit) return;
    window._productTableDelegationInit = true;

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('#productsTable [data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (!id) return;

        console.log(`Product table action triggered: ${action} for ID ${id}`);

        switch (action) {
            case 'edit':      editProduct(id);           break;
            case 'view':      viewProduct(id);           break;
            case 'delete':    deleteProduct(id);         break;
            case 'whatsapp':  sendProductWhatsApp(id);   break;
        }
    });
}

// Export functions to global scope for onclick handlers
window.saveProduct = saveProduct;
window.showAddProductModal = showAddProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewProduct = viewProduct;
window.sendProductWhatsApp = sendProductWhatsApp;
window.exportProducts = exportProducts;
window.loadProducts = loadProducts;

// Initialize event delegation immediately or on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductTableDelegation);
} else {
    initProductTableDelegation();
}
