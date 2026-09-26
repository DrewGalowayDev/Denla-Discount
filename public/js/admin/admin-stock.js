/**
 * Admin Stock & Inventory Management Module
 * Handles dedicated Stock section, KPI calculations, quick inline stock adjusters, and bulk restocking
 */

let stockSearchQuery = '';
let stockStatusFilterValue = 'all';
let stockCategoryFilterValue = '';

// Initialize / Reload Stock section
async function loadStockSection() {
    try {
        if (!productsData || productsData.length === 0) {
            if (typeof loadProducts === 'function') {
                await loadProducts();
            }
        }

        populateStockCategoriesDropdown();
        updateStockKPIs();
        renderStockTable();
    } catch (err) {
        console.error('Error loading stock section:', err);
    }
}

// Populate Category Filter dropdown in Stock section
function populateStockCategoriesDropdown() {
    const select = document.getElementById('stockCategoryFilter');
    if (!select) return;

    if (categoriesData && categoriesData.length > 0) {
        select.innerHTML = '<option value="">All Categories</option>' +
            categoriesData.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
}

// Calculate and update KPI stats
function updateStockKPIs() {
    const total = productsData.length;
    const outOfStock = productsData.filter(p => p.stock === 0).length;
    const lowStock = productsData.filter(p => p.stock > 0 && p.stock < 10).length;
    const healthy = productsData.filter(p => p.stock >= 10).length;

    const statTotal = document.getElementById('stockStatTotal');
    const statOut = document.getElementById('stockStatOut');
    const statLow = document.getElementById('stockStatLow');
    const statHealthy = document.getElementById('stockStatHealthy');
    const sidebarLowBadge = document.getElementById('lowStockSidebarBadge');

    if (statTotal) statTotal.textContent = total;
    if (statOut) statOut.textContent = outOfStock;
    if (statLow) statLow.textContent = lowStock;
    if (statHealthy) statHealthy.textContent = healthy;

    if (sidebarLowBadge) {
        const totalAlerts = outOfStock + lowStock;
        sidebarLowBadge.textContent = totalAlerts;
        sidebarLowBadge.style.display = totalAlerts > 0 ? 'inline-block' : 'none';
        sidebarLowBadge.className = outOfStock > 0 ? 'badge bg-danger ms-auto' : 'badge bg-warning text-dark ms-auto';
    }
}

// Filter handlers
function handleStockSearch(q) {
    stockSearchQuery = (q || '').toLowerCase();
    renderStockTable();
}

function handleStockCategoryFilter(cat) {
    stockCategoryFilterValue = cat;
    renderStockTable();
}

function filterStockStatus(status) {
    stockStatusFilterValue = status || 'all';
    const statusSelect = document.getElementById('stockStatusFilter');
    if (statusSelect) statusSelect.value = stockStatusFilterValue;
    renderStockTable();
}

// Render the stock table
function renderStockTable() {
    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return;

    let filtered = productsData.slice();

    if (stockSearchQuery) {
        filtered = filtered.filter(p =>
            (p.name && p.name.toLowerCase().includes(stockSearchQuery)) ||
            (p.brand && p.brand.toLowerCase().includes(stockSearchQuery))
        );
    }

    if (stockCategoryFilterValue) {
        filtered = filtered.filter(p => String(p.category) === String(stockCategoryFilterValue));
    }

    if (stockStatusFilterValue === 'out') {
        filtered = filtered.filter(p => p.stock === 0);
    } else if (stockStatusFilterValue === 'low') {
        filtered = filtered.filter(p => p.stock > 0 && p.stock < 10);
    } else if (stockStatusFilterValue === 'healthy') {
        filtered = filtered.filter(p => p.stock >= 10);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-muted">
                    <i class="fas fa-boxes-stacked fa-3x mb-3 d-block opacity-50"></i>
                    <p class="mb-2 fw-semibold">No products match your inventory filter</p>
                    <button class="btn btn-sm btn-outline-primary" onclick="filterStockStatus('all'); document.getElementById('stockSearchInput').value=''; handleStockSearch('');">
                        Reset Filters
                    </button>
                </td>
            </tr>
        `;
        syncStockTableSelection();
        return;
    }

    tbody.innerHTML = filtered.map(product => {
        const isSelected = selectedProductIds.has(product.id);
        let stockBadgeClass = 'bg-success';
        let statusLabel = 'In Stock';

        if (product.stock === 0) {
            stockBadgeClass = 'bg-danger';
            statusLabel = 'Out of Stock';
        } else if (product.stock < 10) {
            stockBadgeClass = 'bg-warning text-dark';
            statusLabel = 'Low Stock';
        }

        return `
            <tr data-stock-product-id="${product.id}" class="${isSelected ? 'table-active' : ''}">
                <td>
                    <input type="checkbox" class="stock-item-checkbox" value="${product.id}" ${isSelected ? 'checked' : ''} onchange="handleStockCheckboxChange(this)">
                </td>
                <td>
                    <img src="${product.image}" alt="${product.name}" class="rounded border" style="width: 44px; height: 44px; object-fit: contain;" onerror="this.src='img/product-1.png'">
                </td>
                <td>
                    <div class="fw-bold text-dark mb-0">${product.name}</div>
                    <small class="text-muted">${product.brand || 'General Store'}</small>
                </td>
                <td><span class="text-muted small">${product.brand || '—'}</span></td>
                <td><strong>${formatCurrency(product.price)}</strong></td>
                <td class="text-center">
                    <span class="badge ${stockBadgeClass} fs-6 px-3 py-2 rounded-pill fw-bold" id="stockBadge-${product.id}">
                        ${product.stock} units
                    </span>
                </td>
                <td>
                    <!-- Quick Inline Incrementers -->
                    <div class="d-flex align-items-center justify-content-center gap-1">
                        <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2" onclick="quickAdjustStock('${product.id}', -5)" title="Subtract 5 units">-5</button>
                        <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2" onclick="quickAdjustStock('${product.id}', -1)" title="Subtract 1 unit">-1</button>
                        <button type="button" class="btn btn-sm btn-outline-success py-1 px-2 fw-bold" onclick="quickAdjustStock('${product.id}', 10)" title="Add +10 units">+10</button>
                        <button type="button" class="btn btn-sm btn-outline-success py-1 px-2 fw-bold" onclick="quickAdjustStock('${product.id}', 50)" title="Add +50 units">+50</button>
                        <button type="button" class="btn btn-sm btn-success py-1 px-2 fw-bold" onclick="quickAdjustStock('${product.id}', 100)" title="Add +100 units">+100</button>
                    </div>
                </td>
                <td class="text-center">
                    <span class="badge ${stockBadgeClass} bg-opacity-10 ${product.stock === 0 ? 'text-danger' : (product.stock < 10 ? 'text-warning text-dark' : 'text-success')} border px-2 py-1">
                        ${statusLabel}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    syncStockTableSelection();
}

// Checkbox selection in Stock section
function handleStockCheckboxChange(cb) {
    const id = String(cb.value).trim();
    const tr = cb.closest('tr');
    if (cb.checked) {
        selectedProductIds.add(id);
        if (tr) tr.classList.add('table-active');
    } else {
        selectedProductIds.delete(id);
        if (tr) tr.classList.remove('table-active');
    }
    syncStockTableSelection();
    if (typeof updateSelectionUI === 'function') updateSelectionUI();
}

function toggleStockSelectAll(checked) {
    document.querySelectorAll('.stock-item-checkbox').forEach(cb => {
        const id = String(cb.value).trim();
        cb.checked = checked;
        const tr = cb.closest('tr');
        if (checked) {
            selectedProductIds.add(id);
            if (tr) tr.classList.add('table-active');
        } else {
            selectedProductIds.delete(id);
            if (tr) tr.classList.remove('table-active');
        }
    });
    syncStockTableSelection();
    if (typeof updateSelectionUI === 'function') updateSelectionUI();
}

function syncStockTableSelection() {
    const count = selectedProductIds.size;
    const badge = document.getElementById('stockSelectedBadge');
    if (badge) {
        badge.textContent = `${count} selected`;
        badge.className = count > 0 ? 'badge bg-success py-2 px-3 fs-6 fw-bold' : 'badge bg-secondary py-2 px-3 fs-6';
    }

    const selectAll = document.getElementById('stockSelectAll');
    if (selectAll) {
        const cbs = document.querySelectorAll('.stock-item-checkbox');
        const checked = document.querySelectorAll('.stock-item-checkbox:checked');
        if (cbs.length === 0) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        } else if (checked.length === cbs.length) {
            selectAll.checked = true;
            selectAll.indeterminate = false;
        } else if (checked.length > 0) {
            selectAll.checked = false;
            selectAll.indeterminate = true;
        } else {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        }
    }
}

// Quick Single-Product Stock Adjuster (instant API call)
async function quickAdjustStock(productId, delta) {
    const product = productsData.find(p => String(p.id) === String(productId));
    if (!product) return;

    const newStock = Math.max(0, product.stock + delta);

    try {
        const response = await apiRequest(`/products/${productId}/stock`, {
            method: 'PUT',
            body: JSON.stringify({ stock: newStock })
        });

        if (response.success) {
            product.stock = newStock;
            updateStockKPIs();
            renderStockTable();
            if (typeof renderProductsTable === 'function') renderProductsTable();
            if (typeof showToast === 'function') {
                const actionSign = delta >= 0 ? `+${delta}` : `${delta}`;
                showToast('success', `${product.name}: stock adjusted (${actionSign}) -> ${newStock} units`);
            }
        }
    } catch (err) {
        console.error('Error updating stock:', err);
        if (typeof showToast === 'function') {
            showToast('error', 'Failed to update stock');
        }
    }
}

// Export functions to global window
window.loadStockSection = loadStockSection;
window.renderStockTable = renderStockTable;
window.handleStockSearch = handleStockSearch;
window.handleStockCategoryFilter = handleStockCategoryFilter;
window.filterStockStatus = filterStockStatus;
window.handleStockCheckboxChange = handleStockCheckboxChange;
window.toggleStockSelectAll = toggleStockSelectAll;
window.syncStockTableSelection = syncStockTableSelection;
window.quickAdjustStock = quickAdjustStock;
