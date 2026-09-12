/**
 * Denla Discount Shop - Product Marquee
 * Displays scrolling latest products banner
 */

// Product Marquee Loader
const MARQUEE_API_URL = '/api'; // Hardcoded for reliability

async function loadProductMarquee() {
    console.log('🔍 Loading product marquee...');
    const marquee = document.getElementById('productMarquee');
    
    if (!marquee) {
        console.error('❌ Marquee element not found!');
        return;
    }
    
    console.log('✅ Marquee element found:', marquee);
    
    // Show loading state
    marquee.innerHTML = '<div class="marquee-item"><p style="color: white; padding: 20px;">Loading products...</p></div>';
    
    try {
        const apiUrl = `${MARQUEE_API_URL}/products?limit=15`;
        console.log('📡 Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Raw data type:', typeof data, 'Is array:', Array.isArray(data));
        
        // Extract products array
        let products = [];
        if (Array.isArray(data)) {
            products = data;
        } else if (data.products && Array.isArray(data.products)) {
            products = data.products;
        } else if (data.data && Array.isArray(data.data)) {
            products = data.data;
        }
        
        console.log('✅ Products extracted:', products.length, 'items');
        
        if (products.length === 0) {
            console.warn('⚠️ No products found');
            marquee.innerHTML = '<div class="marquee-item"><p style="color: white; padding: 20px;">No products available</p></div>';
            return;
        }
        
        // Log first product for debugging
        console.log('📦 First product sample:', JSON.stringify(products[0], null, 2));
        
        // Duplicate products for seamless loop
        const duplicatedProducts = [...products, ...products];
        
        const marqueeHTML = duplicatedProducts.map((product, index) => {
            // Handle images
            let image = 'img/product-1.png';
            if (product.images) {
                if (Array.isArray(product.images) && product.images.length > 0) {
                    image = product.images[0];
                } else if (typeof product.images === 'string') {
                    try {
                        const parsed = JSON.parse(product.images);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            image = parsed[0];
                        }
                    } catch (e) {
                        image = product.images;
                    }
                }
            } else if (product.image) {
                image = product.image;
            }
            
            // Handle price
            const price = product.price || product.selling_price || 0;
            const oldPrice = product.old_price || product.oldPrice || product.cost_price;
            const hasDiscount = oldPrice && parseFloat(oldPrice) > parseFloat(price);
            
            if (index === 0) {
                console.log('🏷️ Sample item - Name:', product.name, 'Price:', price, 'Image:', image);
            }
            
            return `
                <div class="marquee-item" onclick="window.location.href='shop.html'">
                    <img src="${image}" alt="${product.name || 'Product'}" class="marquee-item-image" onerror="this.src='img/product-1.png'">
                    <div class="marquee-item-content">
                        <span class="marquee-item-badge">✨ NEW</span>
                        <h6 class="marquee-item-name">${product.name || 'Product'}</h6>
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
        
        console.log('✅ Generated HTML length:', marqueeHTML.length, 'characters');
        console.log('✅ First 200 chars of HTML:', marqueeHTML.substring(0, 200));
        marquee.innerHTML = marqueeHTML;
        console.log('🎉 Marquee innerHTML set! Items displayed:', duplicatedProducts.length);
        console.log('🎉 Marquee children count:', marquee.children.length);
        
    } catch (error) {
        console.error('❌ Error loading marquee:', error);
        console.error('❌ Error stack:', error.stack);
        marquee.innerHTML = `<div class="marquee-item"><p style="color: white; padding: 20px;">⚠️ Error: ${error.message}</p></div>`;
    }
}

// Initialize marquee
console.log('🚀 Marquee script loaded, readyState:', document.readyState);

function initMarquee() {
    console.log('⏰ initMarquee called');
    setTimeout(() => {
        console.log('⏳ Calling loadProductMarquee after delay...');
        loadProductMarquee();
    }, 200);
}

if (document.readyState === 'loading') {
    console.log('📖 DOM still loading, adding listener...');
    document.addEventListener('DOMContentLoaded', initMarquee);
} else {
    console.log('✅ DOM already loaded, initializing now...');
    initMarquee();
}
