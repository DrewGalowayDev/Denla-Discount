/**
 * Currency Switcher for Awesome Technologies
 * Handles currency conversion between KSh and USD across the entire website
 */

class CurrencyManager {
    constructor() {
        this.currentCurrency = 'KSh';
        this.exchangeRate = 130; // 1 USD = 130 KSh (you can update this)
        this.storageKey = 'awesomeTech_currency';
        this.init();
    }

    init() {
        // Load saved currency preference
        const savedCurrency = localStorage.getItem(this.storageKey);
        if (savedCurrency) {
            this.currentCurrency = savedCurrency;
        }

        // Create currency switcher UI
        this.createSwitcherUI();

        // Apply currency to all prices on page
        this.convertAllPrices();

        // Listen for dynamic content changes
        this.observeDOMChanges();
    }

    createSwitcherUI() {
        // Check if switcher already exists
        if (document.getElementById('currencySwitcher')) {
            return;
        }

        // Create switcher HTML
        const switcherHTML = `
            <div class="currency-switcher" id="currencySwitcher">
                <button class="currency-btn ${this.currentCurrency === 'KSh' ? 'active' : ''}" 
                        data-currency="KSh" 
                        id="btnKSh"
                        title="Kenyan Shilling">
                    <i class="fas fa-coins me-1"></i> KSh
                </button>
                <button class="currency-btn ${this.currentCurrency === 'USD' ? 'active' : ''}" 
                        data-currency="USD" 
                        id="btnUSD"
                        title="US Dollar">
                    <i class="fas fa-dollar-sign me-1"></i> USD
                </button>
            </div>
        `;

        // Insert into navbar (after search or before cart)
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = switcherHTML;
            navbar.insertBefore(tempDiv.firstElementChild, navbar.firstChild);
            
            // Add event listeners
            document.getElementById('btnKSh').addEventListener('click', () => this.switchCurrency('KSh'));
            document.getElementById('btnUSD').addEventListener('click', () => this.switchCurrency('USD'));
        }
    }

    switchCurrency(currency) {
        if (this.currentCurrency === currency) return;

        this.currentCurrency = currency;
        localStorage.setItem(this.storageKey, currency);

        // Update button states
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.currency === currency);
        });

        // Convert all prices
        this.convertAllPrices();

        // Show notification
        this.showNotification(`Currency changed to ${currency}`);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('currencyChanged', { 
            detail: { currency, exchangeRate: this.exchangeRate } 
        }));
    }

    convertAllPrices() {
        // Find all elements with prices
        const priceSelectors = [
            '.price',
            '.current-price',
            '.old-price',
            '.marquee-item-price',
            '.marquee-item-old-price',
            '.search-result-price',
            '.product-price',
            '[data-price]',
            '.stats-value',
            '#subtotalAmount',
            '#shippingAmount',
            '#totalAmount',
            '.cart-item-price',
            '.order-total',
            '.amount'
        ];

        document.querySelectorAll(priceSelectors.join(', ')).forEach(element => {
            this.convertElementPrice(element);
        });

        // Convert text nodes containing "KSh" or "$"
        this.convertTextPrices();
    }

    convertElementPrice(element) {
        let priceText = element.textContent || element.innerText;
        
        // Skip if already processed or empty
        if (!priceText || priceText.trim() === '') return;

        // Store original price if not already stored
        if (!element.dataset.originalPrice) {
            // Extract numeric value
            const match = priceText.match(/[\d,]+\.?\d*/);
            if (match) {
                const cleanPrice = match[0].replace(/,/g, '');
                element.dataset.originalPrice = cleanPrice;
                element.dataset.originalCurrency = priceText.includes('$') ? 'USD' : 'KSh';
            }
        }

        if (element.dataset.originalPrice) {
            const originalPrice = parseFloat(element.dataset.originalPrice);
            const originalCurrency = element.dataset.originalCurrency;
            
            let newPrice = originalPrice;
            let symbol = 'KSh ';

            // Convert based on current currency
            if (this.currentCurrency === 'USD') {
                if (originalCurrency === 'KSh') {
                    newPrice = originalPrice / this.exchangeRate;
                }
                symbol = '$';
            } else {
                if (originalCurrency === 'USD') {
                    newPrice = originalPrice * this.exchangeRate;
                }
                symbol = 'KSh ';
            }

            // Format the price
            const formattedPrice = this.formatPrice(newPrice);
            
            // Update element
            if (element.tagName === 'INPUT') {
                element.value = symbol + formattedPrice;
            } else {
                // Preserve any HTML structure
                const textOnly = element.textContent.replace(/[\d,]+\.?\d*/, formattedPrice);
                if (priceText.includes('KSh') || priceText.includes('$')) {
                    element.textContent = textOnly.replace(/KSh\s*|\$/g, symbol);
                } else {
                    element.textContent = symbol + formattedPrice;
                }
            }
        }
    }

    convertTextPrices() {
        // Convert prices in text nodes (like in tables, descriptions, etc.)
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.match(/KSh\s*[\d,]+|USD?\s*[\d,]+|\$[\d,]+/)) {
                textNodes.push(node);
            }
        }

        textNodes.forEach(node => {
            if (!node.parentElement) return;
            
            // Skip if parent already has data-original-price
            if (node.parentElement.dataset.originalPrice) return;

            let text = node.textContent;
            const priceRegex = /(KSh|USD?|\$)\s*([\d,]+(?:\.\d{2})?)/g;
            
            text = text.replace(priceRegex, (match, currSymbol, amount) => {
                const numAmount = parseFloat(amount.replace(/,/g, ''));
                const isKsh = currSymbol === 'KSh';
                const isUsd = currSymbol === '$' || currSymbol === 'USD';

                let convertedAmount = numAmount;

                if (this.currentCurrency === 'USD' && isKsh) {
                    convertedAmount = numAmount / this.exchangeRate;
                    return '$' + this.formatPrice(convertedAmount);
                } else if (this.currentCurrency === 'KSh' && isUsd) {
                    convertedAmount = numAmount * this.exchangeRate;
                    return 'KSh ' + this.formatPrice(convertedAmount);
                }

                return match;
            });

            node.textContent = text;
        });
    }

    formatPrice(price) {
        if (this.currentCurrency === 'USD') {
            return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        } else {
            return Math.round(price).toLocaleString();
        }
    }

    convertPrice(price, fromCurrency = 'KSh') {
        const numPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;
        
        if (this.currentCurrency === 'USD' && fromCurrency === 'KSh') {
            return numPrice / this.exchangeRate;
        } else if (this.currentCurrency === 'KSh' && fromCurrency === 'USD') {
            return numPrice * this.exchangeRate;
        }
        
        return numPrice;
    }

    formatAmount(amount, fromCurrency = 'KSh') {
        const converted = this.convertPrice(amount, fromCurrency);
        const formatted = this.formatPrice(converted);
        const symbol = this.currentCurrency === 'USD' ? '$' : 'KSh ';
        return symbol + formatted;
    }

    showNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('.currency-notification');
        if (existing) existing.remove();

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'currency-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
        `;
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);

        // Hide and remove after 2 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    observeDOMChanges() {
        // Watch for dynamic content changes (e.g., from AJAX)
        const observer = new MutationObserver((mutations) => {
            let shouldConvert = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.textContent && node.textContent.match(/KSh|USD|\$/)) {
                            shouldConvert = true;
                        }
                    }
                });
            });

            if (shouldConvert) {
                // Debounce the conversion
                clearTimeout(this.conversionTimeout);
                this.conversionTimeout = setTimeout(() => {
                    this.convertAllPrices();
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    getCurrentCurrency() {
        return this.currentCurrency;
    }

    getExchangeRate() {
        return this.exchangeRate;
    }

    updateExchangeRate(newRate) {
        this.exchangeRate = newRate;
        this.convertAllPrices();
    }
}

// Initialize currency manager
let currencyManager;

document.addEventListener('DOMContentLoaded', function() {
    currencyManager = new CurrencyManager();
});

// Make it globally available
window.currencyManager = currencyManager;
