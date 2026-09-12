
// Backend base (auto-detect based on current URL)
const BACKEND_BASE = window.location.origin;

// Product endpoints and container mapping - Updated for shop categories
const PRODUCT_CONFIGS = [
    { endpoint: '/api/products/new-arrivals?limit=4', containerId: 'justInGrid', priority: 1 },
    { endpoint: '/api/products?limit=50', containerId: 'products-tab-1', category: 'all', priority: 2 },
    { endpoint: '/api/products?category=Groceries&limit=50', containerId: 'products-tab-2', category: 'groceries', priority: 3 },
    { endpoint: '/api/products?category=Beverages&limit=50', containerId: 'products-tab-3', category: 'beverages', priority: 4 },
    { endpoint: '/api/products?category=Dairy Products&limit=50', containerId: 'products-tab-4', category: 'dairy', priority: 5 },
    { endpoint: '/api/products?category=Household Items&limit=50', containerId: 'products-tab-5', category: 'household', priority: 6 },
    { endpoint: '/api/products?category=Personal Care&limit=50', containerId: 'products-tab-6', category: 'personal-care', priority: 7 },
    { endpoint: '/api/products?limit=200', containerId: 'productListCarousel', isCarousel: true, priority: 8 }
];

// Category keywords for filtering products
const CATEGORY_KEYWORDS = {
    'groceries': ['sugar', 'maize', 'flour', 'rice', 'beans', 'wheat', 'cooking', 'oil', 'unga', 'salt', 'pembe', 'kabras', 'soko', 'jogoo', 'chipsy', 'elianto', 'kimbo', 'salit', 'mwitu', 'basmati', 'pasta', 'spaghetti', 'macaroni', 'azam', 'bidco'],
    'beverages': ['tea', 'coffee', 'juice', 'soda', 'water', 'drink', 'beverage', 'coca', 'pepsi', 'fanta', 'sprite', 'ketepa', 'brookside', 'tusker', 'pilsner', 'white cap', 'senator', 'balozi', 'mango', 'orange', 'tropical', 'minute maid', 'del monte', 'freshjus'],
    'dairy': ['milk', 'yogurt', 'cheese', 'butter', 'cream', 'dairy', 'brookside', 'lato', 'mala', 'tuzo', 'kilifi', 'nunu', 'ilara', 'long life', 'fresh milk', 'ghee', 'margarine', 'prestige'],
    'household': ['soap', 'detergent', 'tissue', 'toilet', 'cleaning', 'disinfectant', 'bleach', 'jik', 'omo', 'ariel', 'persil', 'sunlight', 'downy', 'softlan', 'vim', 'domestos', 'harpic', 'handy andy', 'colgate', 'close up'],
    'personal-care': ['soap', 'shampoo', 'lotion', 'cream', 'deodorant', 'toothpaste', 'tissue', 'pads', 'sanitary', 'diapers', 'pampers', 'always', 'geisha', 'imperial leather', 'lux', 'dettol', 'nivea', 'vaseline', 'johnson', 'baby', 'dove', 'shield', 'axe']
};

document.addEventListener('DOMContentLoaded', () => {
    // Replace any references to missing product-default.png with a safe fallback
    try {
        document.querySelectorAll('img').forEach(img => {
            if (img.getAttribute('src') === 'img/product-default.png') {
                img.src = 'img/product-1.png';
            }
            img.addEventListener('error', function () {
                if (!this.dataset.fallbackApplied) {
                    this.dataset.fallbackApplied = '1';
                    this.src = 'img/product-1.png';
                }
            });
        });
    } catch (e) {}
    
    // Load products immediately
    loadAllProductsOnce().then(() => {
        // Load category counts after products are loaded (non-blocking)
        loadCategoryCounts();
    }).catch((err) => {
        console.error('Error loading products:', err);
    });
});

// Loading notification functions (disabled)
function showLoadingNotification() {
    // Disabled loading popup effect
}

function hideLoadingNotification() {
    const notification = document.getElementById('loading-notification');
    const overlay = document.getElementById('loading-overlay');
    if (notification) notification.remove();
    if (overlay) overlay.remove();
}

// ─── API Response Cache ────────────────────────────────────────────────────
// Caches GET responses in memory for 5 minutes to avoid redundant API calls.
// This is the primary defence against hitting rate limits on page navigation.
const _apiCache = new Map();
const _API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const _inFlight = new Map(); // deduplicates simultaneous identical requests

function _getCached(url) {
    const entry = _apiCache.get(url);
    if (!entry) return null;
    if (Date.now() - entry.ts > _API_CACHE_TTL) {
        _apiCache.delete(url);
        return null;
    }
    return entry.clone(); // Return a clone so the body can be re-read
}

async function _setCached(url, response) {
    // Only cache successful GET responses
    if (!response || !response.ok) return response;
    try {
        // We need to clone before reading, so the original can still be consumed
        const clone = response.clone();
        _apiCache.set(url, { resp: clone, ts: Date.now(), clone: () => clone.clone() });
    } catch (e) { /* ignore caching errors silently */ }
    return response;
}

// Helper: fetch with in-memory caching + retries on 429 Too Many Requests
async function fetchWithRetries(url, options = {}, maxAttempts = 3, baseDelay = 500) {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';

    // 1. Check cache for GET requests
    if (isGet) {
        const cached = _getCached(url);
        if (cached) {
            // console.log(`[Cache HIT] ${url}`);
            return cached;
        }

        // 2. Deduplicate in-flight requests
        if (_inFlight.has(url)) {
            // console.log(`[Dedup] Waiting for in-flight request: ${url}`);
            return _inFlight.get(url);
        }
    }

    const requestPromise = (async () => {
        let attempt = 0;
        let lastResp = null;
        while (attempt < maxAttempts) {
            attempt += 1;
            try {
                const resp = await fetch(url, options);
                lastResp = resp;
                if (resp.ok) {
                    if (isGet) await _setCached(url, resp.clone());
                    return resp;
                }
                // Respect server's Retry-After header or use exponential backoff
                if (resp.status === 429) {
                    const retryAfter = resp.headers.get('Retry-After');
                    const delay = retryAfter
                        ? parseInt(retryAfter) * 1000
                        : baseDelay * Math.pow(2, attempt - 1);
                    console.warn(`[Rate Limit] ${url} → 429. Waiting ${delay}ms before retry ${attempt}/${maxAttempts}`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                // For other non-ok statuses, don't retry
                return resp;
            } catch (err) {
                console.warn(`[Fetch Error] ${url} (attempt ${attempt}/${maxAttempts}):`, err);
                if (attempt < maxAttempts) {
                    await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt - 1)));
                }
            }
        }
        return lastResp;
    })();

    if (isGet) {
        _inFlight.set(url, requestPromise);
        try {
            const result = await requestPromise;
            return result;
        } finally {
            _inFlight.delete(url);
        }
    }

    return requestPromise;
}

// Global cache for product details to populate modal quickly
window._productCache = window._productCache || {};


async function loadProducts(endpoint, containerId, isCarousel = false) {
    try {
        // Try the specific endpoint first. If it 404s or fails, try a more general fallback.
        let response;
        try {
            response = await fetchWithRetries(`${BACKEND_BASE}${endpoint}`);
        } catch (err) {
            console.warn(`Fetch to ${BACKEND_BASE}${endpoint} failed:`, err);
            response = null;
        }

        // If the specific endpoint returned 404 or other non-ok, try fallbacks
        if (!response || !response.ok) {
            console.warn(`${BACKEND_BASE}${endpoint} returned ${response ? response.status : 'no response'}. Trying fallback endpoints.`);
            const fallbacks = [
                `${BACKEND_BASE}/api/products?limit=100`, // general products endpoint on backend
                `/api/products?limit=100` // relative endpoint when backend is same origin or proxied
            ];

            for (const fb of fallbacks) {
                try {
                    const fbResp = await fetchWithRetries(fb);
                    if (fbResp && fbResp.ok) {
                        response = fbResp;
                        console.log(`Fallback succeeded: ${fb}`);
                        break;
                    } else {
                        console.warn(`Fallback ${fb} returned ${fbResp ? fbResp.status : 'no response'}`);
                    }
                } catch (err) {
                    console.warn(`Fallback fetch to ${fb} failed:`, err);
                }
            }
        }

        if (!response) {
            console.error(`All fetch attempts failed for ${endpoint}.`);
            return;
        }

        if (!response.ok) {
            // Non-OK response (e.g., 429 retried out or 404). Try to read text for debugging then abort.
            let txt = null;
            try { txt = await response.text(); } catch (e) { /* ignore */ }
            console.error(`${BACKEND_BASE}${endpoint} returned ${response.status}. Response text:`, txt);
            return;
        }

        // Ensure we only call json() for JSON responses
        const contentType = response.headers.get('content-type') || '';
        let data = null;
        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (e) {
                console.error('Failed to parse JSON response for', endpoint, e);
                return;
            }
        } else {
            // Not JSON — log and abort
            const txt = await response.text().catch(() => null);
            console.error('Expected JSON but got:', txt);
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        // API may return different shapes: { products: [...] }, { data: [...] }, or an array directly
        const products = data.products || data.data || (Array.isArray(data) ? data : null);
        
        if (products && Array.isArray(products) && products.length > 0) {
            // If we fell back to a generic products list, perform client-side filtering
            let selected = products;

            try {
                // Infer desired filter from the original endpoint string
                if (endpoint.includes('new-arrivals')) {
                    // Prefer explicit flag, otherwise take top N
                    const filtered = products.filter(p => p.is_new_arrival || p.is_new);
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : 12;
                    selected = (filtered.length > 0 ? filtered : products).slice(0, limit);
                } else if (endpoint.includes('featured')) {
                    const filtered = products.filter(p => p.is_featured || p.featured);
                    selected = filtered.length > 0 ? filtered : products.slice(0, 12);
                } else if (endpoint.includes('deals') || endpoint.includes('deal')) {
                    const filtered = products.filter(p => p.is_deal || p.deal || p.on_sale || (p.old_price && p.old_price > p.price));
                    selected = filtered.length > 0 ? filtered : products.slice(0, 12);
                } else {
                    // Generic products listing: respect requested limit if present
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : products.length;
                    selected = products.slice(0, limit);
                }
            } catch (e) {
                console.warn('Client-side filtering failed, falling back to original products array:', e);
                selected = products.slice(0, 12);
            }

            console.log(`Loading ${selected.length} products into ${containerId}`);

            // cache products by id for later detail lookup
            selected.forEach(p => { if (p && (p.id || p._id || p.product_id)) {
                const pid = p.id || p._id || p.product_id;
                window._productCache[pid] = p;
            }});

            if (isCarousel) {
                container.innerHTML = selected.map((product) => renderCarouselProduct(product)).join('');
                // Show the "All Products" section only if products were loaded
                if (containerId === 'productListCarousel' && selected.length > 0) {
                    const section = document.getElementById('allProductsSection');
                    if (section) section.style.display = 'block';
                }
            } else {
                container.innerHTML = selected.map((product, index) => renderProduct(product, index)).join('');
            }

            // Re-initialize animations
            reinitAnimations();
        } else {
            console.warn(`No products found for ${containerId}:`, data);
            // Hide the section if no products
            if (containerId === 'productListCarousel') {
                const section = document.getElementById('allProductsSection');
                if (section) section.style.display = 'none';
            }
        }
    } catch (error) {
        console.error(`Error loading products for ${containerId}:`, error);
        // Hide the section on error
        if (containerId === 'productListCarousel') {
            const section = document.getElementById('allProductsSection');
            if (section) section.style.display = 'none';
        }
    }
}

// Fetch all products once and partition client-side for each PRODUCTS_CONFIG entry.
async function loadAllProductsOnce() {
    try {
        // single fetch for all products (adjust limit as needed)
        const resp = await fetchWithRetries(`${BACKEND_BASE}/api/products?limit=200`);
        if (!resp) {
            console.error('Failed to fetch products: no response');
            // try local mock
            return await _attemptLocalMockLoad();
        }
        if (!resp.ok) {
            const txt = await resp.text().catch(() => null);
            console.error('Products endpoint returned non-ok:', resp.status, txt);
            // try local mock
            return await _attemptLocalMockLoad();
        }
        const ct = resp.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
            const txt = await resp.text().catch(() => null);
            console.error('Expected JSON from products endpoint but got:', txt);
            // try local mock
            return await _attemptLocalMockLoad();
        }
        const allData = await resp.json();
        let allProducts = allData.products || allData.data || (Array.isArray(allData) ? allData : []);
        if (!Array.isArray(allProducts) || allProducts.length === 0) {
            console.warn('No products returned from consolidated fetch:', allData);
            return;
        }

        // CRITICAL FIX: Remove duplicate products by ID AND by name+price combination
        const seenIds = new Set();
        const seenNamePrice = new Set();
        allProducts = allProducts.filter(p => {
            const pid = p && (p.id || p._id || p.product_id);
            const nameKey = `${(p.name || '').toLowerCase().trim()}_${p.price}`;
            
            // Skip if we've seen this ID
            if (pid && seenIds.has(pid)) {
                console.warn('Duplicate product ID filtered:', pid, p.name);
                return false;
            }
            
            // Skip if we've seen this exact name+price combo (likely duplicate entry)
            if (seenNamePrice.has(nameKey)) {
                console.warn('Duplicate product name+price filtered:', p.name, p.price);
                return false;
            }
            
            if (pid) seenIds.add(pid);
            seenNamePrice.add(nameKey);
            return true;
        });

        console.log(`Products after deduplication: ${allProducts.length}`);

        // cache by id
        allProducts.forEach(p => {
            const pid = p && (p.id || p._id || p.product_id);
            if (pid) window._productCache[pid] = p;
        });

        // Sort configs by priority for faster perceived loading
        const sortedConfigs = [...PRODUCT_CONFIGS].sort((a, b) => (a.priority || 99) - (b.priority || 99));

        // Process high-priority containers first (visible ones)
        for (const config of sortedConfigs) {
            const { endpoint, containerId, isCarousel, category } = config;
            const container = document.getElementById(containerId);
            if (!container) continue;

            let selected = [];
            try {
                if (endpoint.includes('new-arrivals')) {
                    const filtered = allProducts.filter(p => p.is_new_arrival || p.is_new);
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : 12;
                    selected = (filtered.length > 0 ? filtered : allProducts).slice(0, limit);
                } else if (category && category !== 'all') {
                    // Filter by category keywords
                    const keywords = CATEGORY_KEYWORDS[category] || [];
                    const filtered = allProducts.filter(p => {
                        const productName = (p.name || '').toLowerCase();
                        const productCategory = ((p.categories && p.categories.name) || p.category || '').toLowerCase();
                        const productBrand = (p.brand || '').toLowerCase();
                        const searchText = `${productName} ${productCategory} ${productBrand}`;
                        return keywords.some(kw => searchText.includes(kw));
                    });
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : 50;
                    selected = filtered.slice(0, limit);
                } else if (category === 'all') {
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : allProducts.length;
                    selected = allProducts.slice(0, limit);
                } else {
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : allProducts.length;
                    selected = allProducts.slice(0, limit);
                }
            } catch (e) {
                console.warn('Filtering error, using fallback slice', e);
                selected = allProducts.slice(0, 12);
            }

            // cache selected items (redundant but safe)
            selected.forEach(p => {
                const pid = p && (p.id || p._id || p.product_id);
                if (pid) window._productCache[pid] = p;
            });

            // Render products directly - fast synchronous rendering
            if (isCarousel) {
                container.innerHTML = selected.map((product) => renderCarouselProduct(product)).join('');
                // Show the "All Products" section only if products were loaded
                if (containerId === 'productListCarousel' && selected.length > 0) {
                    const section = document.getElementById('allProductsSection');
                    if (section) section.style.display = 'block';
                }
            } else {
                // Direct rendering - no await blocking
                container.innerHTML = selected.map((product, index) => renderProduct(product, index)).join('');
            }
        }

        // Render top latest products marquee
        renderMarquee(allProducts);

        // re-init animations after initial DOM injection
        reinitAnimations();
    } catch (err) {
        console.error('loadAllProductsOnce failed:', err);
    }
}

// Attempt to load local mock JSON to keep UI functional when API is down
async function _attemptLocalMockLoad() {
    try {
        const mresp = await fetch('js/mock-products.json');
        if (!mresp || !mresp.ok) {
            return;
        }
        const mock = await mresp.json();
        if (!Array.isArray(mock) || mock.length === 0) {
            return;
        }

        // same render path as success
        const allProducts = mock;
        allProducts.forEach(p => {
            const pid = p && (p.id || p._id || p.product_id);
            if (pid) window._productCache[pid] = p;
        });

        // Sort by priority
        const sortedConfigs = [...PRODUCT_CONFIGS].sort((a, b) => (a.priority || 99) - (b.priority || 99));

        for (const config of sortedConfigs) {
            const { endpoint, containerId, isCarousel, category } = config;
            const container = document.getElementById(containerId);
            if (!container) continue;

            let selected = [];
            try {
                if (endpoint.includes('new-arrivals')) {
                    const filtered = allProducts.filter(p => p.is_new_arrival || p.is_new);
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : 12;
                    selected = (filtered.length > 0 ? filtered : allProducts).slice(0, limit);
                } else if (category && category !== 'all') {
                    // Filter by category keywords
                    const keywords = CATEGORY_KEYWORDS[category] || [];
                    const filtered = allProducts.filter(p => {
                        const productName = (p.name || '').toLowerCase();
                        const productCategory = ((p.categories && p.categories.name) || p.category || '').toLowerCase();
                        const productBrand = (p.brand || '').toLowerCase();
                        const searchText = `${productName} ${productCategory} ${productBrand}`;
                        return keywords.some(kw => searchText.includes(kw));
                    });
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : 50;
                    selected = filtered.slice(0, limit);
                } else if (category === 'all') {
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : allProducts.length;
                    selected = allProducts.slice(0, limit);
                } else {
                    const params = endpoint.split('?')[1] || '';
                    const limit = params.split('limit=')[1] ? parseInt(params.split('limit=')[1]) : allProducts.length;
                    selected = allProducts.slice(0, limit);
                }
            } catch (e) {
                selected = allProducts.slice(0, 12);
            }

            if (isCarousel) {
                container.innerHTML = selected.map((product) => renderCarouselProduct(product)).join('');
            } else {
                // Direct rendering for mock data
                container.innerHTML = selected.map((product, index) => renderProduct(product, index)).join('');
            }
        }

        renderMarquee(allProducts);

        reinitAnimations();
    } catch (e) {
        console.error('Loading mock products failed:', e);
    }
}

// Render Top Marquee
function renderMarquee(products) {
    const marquee = document.getElementById('productMarquee');
    if (!marquee || !products || products.length === 0) return;

    // Ensure enough items to smoothly fill across wide screens before duplicating
    let list = [...products];
    while (list.length < 8 && list.length > 0) {
        list = [...list, ...products];
    }
    // Duplicate for seamless 50% translation loop
    const duplicated = [...list, ...list];

    marquee.innerHTML = duplicated.map(p => {
        let image = 'img/product-1.png';
        if (p.images) {
            if (Array.isArray(p.images) && p.images.length > 0) {
                image = p.images[0];
            } else if (typeof p.images === 'string') {
                try {
                    const parsed = JSON.parse(p.images);
                    if (Array.isArray(parsed) && parsed.length > 0) image = parsed[0];
                } catch (e) {
                    image = p.images;
                }
            }
        } else if (p.image_url) {
            image = p.image_url;
        } else if (p.image) {
            image = p.image;
        }

        const price = p.price || p.selling_price || 0;
        const oldPrice = p.old_price || p.oldPrice || p.cost_price;
        const hasDiscount = oldPrice && parseFloat(oldPrice) > parseFloat(price);
        const name = p.name || 'Product';
        const pid = p.id || p._id || '';

        return `
            <div class="marquee-item" onclick="window.location.href='product-detail.html?id=${pid}'">
                <img src="${image}" alt="${name}" class="marquee-item-image" onerror="this.src='img/product-1.png'">
                <div class="marquee-item-content">
                    <span class="marquee-item-badge">✨ NEW</span>
                    <h6 class="marquee-item-name" title="${name}">${name}</h6>
                    <div class="marquee-item-price-wrapper">
                        <span class="marquee-item-price">KSh ${parseFloat(price).toLocaleString()}</span>
                        ${hasDiscount ? `<span class="marquee-item-old-price">KSh ${parseFloat(oldPrice).toLocaleString()}</span>` : ''}
                    </div>
                </div>
                <div class="marquee-item-icon">
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        `;
    }).join('');
}

function renderProduct(product, index) {
    // Reduced animation delay for faster perceived loading
    const delay = Math.min(0.05 + (index % 4) * 0.05, 0.2);

    // Get image - handle JSONB array or single image field
    let image = 'img/product-1.png';
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        image = product.images[0];
    } else if (product.image_url) {
        image = product.image_url;
    } else if (product.image) {
        image = product.image;
    }

    // Determine badges
    let badgeHtml = '';
    if (product.is_new_arrival) {
        badgeHtml = '<div class="product-badge badge-new">New</div>';
    } else if (product.old_price && product.old_price > (product.price || product.selling_price || 0)) {
        badgeHtml = '<div class="product-badge badge-sale">Sale</div>';
    } else if (product.is_deal) {
        badgeHtml = '<div class="product-badge badge-deal">Deal</div>';
    }

    // Extract data
    const title = product.name || 'Product';
    const price = product.price || product.selling_price || 0;
    const oldPrice = product.old_price || product.original_price || product.cost_price || price;
    const category = (product.categories && product.categories.name) || product.category_name || product.category || 'Shop Items';
    const rating = Math.round(product.rating || 5);
    const productId = product.id || product._id || product.product_id || index;

    // Use lazy loading for images below the fold (index > 8)
    const loadingAttr = index > 8 ? 'loading="lazy"' : '';

    return `
    <div class="product-card-wrap" style="animation-delay: ${delay}s">
        <div class="product-card">
            <div class="product-image-wrapper">
                <img src="${image}" class="product-image" alt="${title}" ${loadingAttr} onerror="this.src='img/product-1.png'">
                ${badgeHtml}
                <div class="product-overlay">
                    <button class="btn-view" onclick="viewProduct('${productId}'); return false;" title="Quick View">
                        <i class="fa fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-content">
                <div class="product-category">${category}</div>
                <div class="product-title" title="${title}">${title}</div>
                <div class="product-rating">
                    ${renderStars(rating)}
                </div>
                <div class="product-price">
                    ${oldPrice > price ? `<span class="price-old">KSh ${Math.round(oldPrice).toLocaleString()}</span>` : ''}
                    <span class="price-current">KSh ${Math.round(price).toLocaleString()}</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-cart" onclick="addToCart('${productId}'); return false;">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Add To Cart</span>
                </button>
                <div class="product-actions-icons">
                    <button class="btn-icon" title="Compare" onclick="compareProduct('${productId}'); return false;"><i class="fas fa-random"></i></button>
                    <button class="btn-icon" title="Wishlist" onclick="addToWishlistById('${productId}'); return false;"><i class="fas fa-heart"></i></button>
                </div>
            </div>
        </div>
    </div>
    `;
}

function renderCarouselProduct(product) {
    // Get image - handle JSONB array or single image field
    let image = 'img/product-1.png';
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        image = product.images[0];
    } else if (product.image_url) {
        image = product.image_url;
    } else if (product.image) {
        image = product.image;
    }

    const title = product.name || 'Product';
    const price = product.price || product.selling_price || 0;
    const oldPrice = product.old_price || product.original_price || product.cost_price || price;
    const category = (product.categories && product.categories.name) || product.category_name || product.category || 'Shop Items';

    return `
    <div class="productImg-item products-mini-item border">
        <div class="row g-0">
            <div class="col-5">
                <div class="products-mini-img border-end h-100">
                    <img src="${image}" class="img-fluid w-100 h-100" alt="${title}" loading="lazy" style="object-fit: cover;" onerror="this.src='img/product-1.png'">
                    <div class="products-mini-icon rounded-circle bg-primary">
                        <a href="#" onclick="viewProduct('${product.id}'); return false;"><i class="fa fa-eye fa-1x text-white"></i></a>
                    </div>
                </div>
            </div>
            <div class="col-7">
                <div class="products-mini-content p-3">
                    <a href="#" class="d-block mb-2">${category}</a>
                    <a href="#" class="d-block h4 text-truncate" title="${title}">${title}</a>
                    ${oldPrice > price ? `<del class="me-2 fs-5">KSh ${Math.round(oldPrice).toLocaleString()}</del>` : ''}
                    <span class="text-primary fs-5">KSh ${Math.round(price).toLocaleString()}</span>
                </div>
            </div>
        </div>
        <div class="products-mini-add border p-3">
            <a href="#" onclick="addToCart('${product.id}'); return false;" class="btn btn-primary border-secondary rounded-pill py-2 px-4"><i class="fas fa-shopping-cart me-2"></i> Add To Cart</a>
            <div class="d-flex">
                <a href="#" onclick="compareProduct('${product.id}'); return false;" class="text-primary d-flex align-items-center justify-content-center me-3"><span class="rounded-circle btn-sm-square border"><i class="fas fa-random"></i></span></a>
                <a href="#" onclick="addToWishlistById('${product.id}'); return false;" class="text-primary d-flex align-items-center justify-content-center me-0"><span class="rounded-circle btn-sm-square border"><i class="fas fa-heart"></i></span></a>
            </div>
        </div>
    </div>
    `;
}

function reinitAnimations() {
    // Re-init WOW animations
    if (typeof WOW !== 'undefined') {
        try {
            new WOW().init();
        } catch (e) {
            console.warn('WOW animation re-init failed:', e);
        }
    }

    // Re-init Owl Carousels
    if (typeof $ !== 'undefined' && typeof $.fn.owlCarousel !== 'undefined') {
        // Destroy existing instances
        const carousels = ['.productList-carousel', '.productImg-carousel'];
        carousels.forEach(selector => {
            $(selector).each(function() {
                if ($(this).data('owl.carousel')) {
                    $(this).owlCarousel('destroy');
                }
            });
        });

        // Re-initialize
        setTimeout(() => {
            $('.productList-carousel').owlCarousel({
                autoplay: true,
                smartSpeed: 1000,
                center: false,
                dots: false,
                loop: true,
                margin: 25,
                nav: false,
                responsive: {
                    0: { items: 1 },
                    768: { items: 2 },
                    992: { items: 4 }
                }
            });

            $('.productImg-carousel').owlCarousel({
                autoplay: true,
                smartSpeed: 1000,
                center: false,
                dots: false,
                loop: true,
                margin: 25,
                nav: false,
                responsive: {
                    0: { items: 1 },
                    768: { items: 2 },
                    992: { items: 4 }
                }
            });
        }, 100);
    }
}

function renderStars(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHtml += '<i class="fas fa-star text-primary"></i>';
        } else {
            starsHtml += '<i class="fas fa-star"></i>';
        }
    }
    return starsHtml;
}

// Placeholder functions for interactions
function viewProduct(id) {
    // Try to get cached product
    const pid = id;
    const product = (window._productCache && (window._productCache[pid] || window._productCache[String(pid)])) || null;

    // If not cached, attempt to fetch from API (best effort)
    // Open modal with product object
    const showModalWith = (prod) => {
        try {
            const modalEl = document.getElementById('productDetailModal');
            if (!modalEl) {
                console.warn('Product modal element not found');
                return;
            }

            // Get product name
            const productName = prod.name || prod.title || 'Product';

            // Populate modal fields - ensure image is always set
            const imageEl = modalEl.querySelector('.pd-image');
            const imageSrc = (prod.images && Array.isArray(prod.images) && prod.images[0]) || prod.image_url || prod.image || 'img/product-1.png';
            if (imageEl) {
                imageEl.setAttribute('src', imageSrc);
                imageEl.onerror = function() { this.src = 'img/product-1.png'; };
            }
            
            // Update both the modal header title and the body title
            const headerTitleEl = modalEl.querySelector('.pd-modal-header-title');
            if (headerTitleEl) headerTitleEl.textContent = productName;
            
            const titleEl = modalEl.querySelector('.pd-title');
            if (titleEl) titleEl.textContent = productName;
            
            const categoryEl = modalEl.querySelector('.pd-category');
            if (categoryEl) categoryEl.textContent = (prod.categories && prod.categories.name) || prod.category || '';
            
            const priceEl = modalEl.querySelector('.pd-price');
            if (priceEl) priceEl.textContent = `KSh ${Math.round(prod.price || 0).toLocaleString()}`;
            
            const oldEl = modalEl.querySelector('.pd-oldprice');
            if (oldEl) {
                if (prod.old_price && prod.old_price > prod.price) {
                    oldEl.textContent = `KSh ${Math.round(prod.old_price).toLocaleString()}`;
                    oldEl.style.display = 'inline-block';
                } else {
                    oldEl.style.display = 'none';
                }
            }

            const descEl = modalEl.querySelector('.pd-desc');
            if (descEl) descEl.textContent = prod.description || prod.summary || prod.short_description || '';

            // Handle features - show container only if features exist
            const featuresContainer = modalEl.querySelector('.pd-features-container');
            const featuresEl = modalEl.querySelector('.pd-features');
            if (featuresEl) {
                featuresEl.innerHTML = '';
                const features = prod.features || [];
                
                // If features is a string, try to parse it or split by newline/comma
                let featuresList = [];
                if (Array.isArray(features)) {
                    featuresList = features;
                } else if (typeof features === 'string' && features.trim()) {
                    // Try to parse as JSON first
                    try {
                        featuresList = JSON.parse(features);
                    } catch (e) {
                        // Split by newline or comma
                        featuresList = features.split(/[\n,]/).map(f => f.trim()).filter(f => f);
                    }
                }
                
                if (featuresList.length > 0) {
                    featuresList.forEach(f => {
                        const li = document.createElement('li');
                        li.textContent = typeof f === 'string' ? f : (f.name || f.feature || String(f));
                        featuresEl.appendChild(li);
                    });
                    if (featuresContainer) featuresContainer.style.display = 'block';
                } else {
                    if (featuresContainer) featuresContainer.style.display = 'none';
                }
            }
            
            // Setup Add to Cart button
            const addToCartBtn = modalEl.querySelector('.pd-add-to-cart-btn');
            if (addToCartBtn) {
                // Remove old event listeners by cloning
                const newBtn = addToCartBtn.cloneNode(true);
                addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);
                
                newBtn.addEventListener('click', () => {
                    if (window.cartManager && prod.id) {
                        window.cartManager.addItem({
                            id: prod.id,
                            name: productName,
                            price: prod.price || 0,
                            qty: 1,
                            image: imageSrc
                        });
                        // Close modal
                        const bsModal = bootstrap.Modal.getInstance(modalEl);
                        if (bsModal) bsModal.hide();
                    } else {
                        console.warn('Cart manager not available or product ID missing');
                    }
                });
            }

            // Show Bootstrap modal
            const bsModal = new bootstrap.Modal(modalEl);
            bsModal.show();
        } catch (e) {
            console.error('Failed to show product modal:', e);
        }
    };

    if (product) {
        showModalWith(product);
        return;
    }

    // Fallback: try fetching single product from backend
    (async () => {
        try {
            const resp = await fetch(`${BACKEND_BASE}/api/products/${pid}`);
            if (resp.ok) {
                const prod = await resp.json();
                // Some APIs wrap the object under data/products
                const obj = prod.product || prod.data || prod;
                if (obj) {
                    window._productCache[pid] = obj;
                    showModalWith(obj);
                    return;
                }
            }
        } catch (e) {
            console.warn('Product fetch failed for', pid, e);
        }
        alert('Product details are not available.');
    })();
}

function addToCart(id) {
    console.log('Add to cart:', id);
    if (window.cartManager && typeof window.cartManager.addToCart === 'function') {
        window.cartManager.addToCart(id);
    } else {
        console.error('Cart manager not available');
    }
}

function addToWishlistById(id) {
    console.log('Add to wishlist:', id);
    if (window.wishlistManager && typeof window.wishlistManager.addToWishlist === 'function') {
        window.wishlistManager.addToWishlist(id);
    } else {
        console.error('Wishlist manager not available');
    }
}

function compareProduct(id) {
    console.log('Compare product:', id);
    if (window.cartManager && typeof window.cartManager.showNotification === 'function') {
        window.cartManager.showNotification('Compare', 'Product added to comparison list', 'info');
    } else {
        alert('Product added to comparison list!');
    }
}

function addToCartPlaceholder() {
    alert('Add to cart clicked from details modal.');
}

// Load real-time category counts
async function loadCategoryCounts() {
    try {
        const response = await fetchWithRetries(`${BACKEND_BASE}/api/products?limit=1000`);
        if (!response || !response.ok) {
            console.warn('Could not fetch products for category counts');
            return;
        }

        const data = await response.json();
        const products = data.products || data.data || (Array.isArray(data) ? data : []);

        if (!products || !Array.isArray(products)) {
            console.warn('Invalid products data for category counts');
            return;
        }

        // Count products by category
        const categoryCounts = {};
        products.forEach(product => {
            const categoryName = (product.categories && product.categories.name) || product.category || 'Uncategorized';
            categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        });

        // Update both desktop and mobile category lists
        updateCategoryList('desktopCategoryList', categoryCounts);
        updateCategoryList('mobileCategoryList', categoryCounts);

        console.log('Category counts loaded:', categoryCounts);
    } catch (error) {
        console.error('Error loading category counts:', error);
    }
}

function updateCategoryList(elementId, categoryCounts) {
    const listElement = document.getElementById(elementId);
    if (!listElement) {
        console.warn(`Category list element ${elementId} not found`);
        return;
    }

    // Clear existing content
    listElement.innerHTML = '';

    // Sort categories by count (descending) and then alphabetically
    const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1]; // Sort by count descending
            return a[0].localeCompare(b[0]); // Then alphabetically
        });

    // Create list items
    sortedCategories.forEach(([categoryName, count]) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="categories-bars-item">
                <a href="shop.html?category=${encodeURIComponent(categoryName)}">${categoryName}</a>
                <span>(${count})</span>
            </div>
        `;
        listElement.appendChild(li);
    });

    // If no categories found, show a message
    if (sortedCategories.length === 0) {
        listElement.innerHTML = '<li class="text-muted p-3">No categories available</li>';
    }
}
