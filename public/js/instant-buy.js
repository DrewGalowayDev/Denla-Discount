/**
 * Denla Discount - Instant Buy & Express Checkout Module
 * Enables 1-click "Buy Now" popup on homepage products with instant M-Pesa STK Push & Cash options.
 */

let currentInstantProduct = null;
let currentInstantQty = 1;
let currentInstantPaymentMode = 'mpesa';
let instantStkPollTimer = null;
let instantStkCountdownTimer = null;
let activeMpesaSettings = null;

// Safe modal show/hide helpers
function safeShowModal(modalEl) {
    if (!modalEl) return;
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        } else if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
            $(modalEl).modal('show');
        } else {
            modalEl.classList.add('show');
            modalEl.style.display = 'block';
            modalEl.removeAttribute('aria-hidden');
            document.body.classList.add('modal-open');
        }
    } catch (e) {
        console.warn('Modal show fallback:', e);
        modalEl.classList.add('show');
        modalEl.style.display = 'block';
        document.body.classList.add('modal-open');
    }
}

function safeHideModal(modalEl) {
    if (!modalEl) return;
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const inst = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
            if (inst && typeof inst.hide === 'function') {
                inst.hide();
            }
        }
    } catch (e) {
        console.warn('Bootstrap modal hide error:', e);
    }

    // Comprehensive fallback cleanup to ensure modal ALWAYS closes
    modalEl.classList.remove('show');
    modalEl.style.display = 'none';
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
}

function closeInstantBuyModal() {
    hideInstantStkOverlay();
    const modalEl = document.getElementById('instantBuyModal');
    if (modalEl) {
        safeHideModal(modalEl);
    }
}

function closeInstantReceiptModal() {
    const modalEl = document.getElementById('instantReceiptModal');
    if (modalEl) {
        safeHideModal(modalEl);
    }
}

window.closeInstantBuyModal = closeInstantBuyModal;
window.closeInstantReceiptModal = closeInstantReceiptModal;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchMpesaSettings();
});

// Load active M-Pesa settlement settings from backend
async function fetchMpesaSettings() {
    try {
        const res = await fetch('/api/mpesa/settings');
        const data = await res.json();
        if (data.success && data.settings) {
            activeMpesaSettings = data.settings;
            updateMpesaInfoBadge();
        }
    } catch (e) {
        console.warn('Could not load M-Pesa settings:', e);
    }
}

function updateMpesaInfoBadge() {
    const badge = document.getElementById('instantMpesaBadge');
    if (!badge || !activeMpesaSettings) return;
    const isTill = activeMpesaSettings.transactionType === 'CustomerBuyGoodsOnline';
    badge.innerHTML = `<i class="fas fa-shield-alt text-success me-1"></i> ${isTill ? 'Till' : 'Paybill'} #${activeMpesaSettings.shortcode || '4345167'} Verified`;
}

// Open Instant Buy Modal for a given product
async function openInstantBuyModal(productId) {
    if (!productId) return;

    // Reset state
    currentInstantQty = 1;
    currentInstantPaymentMode = 'mpesa';
    if (instantStkPollTimer) clearInterval(instantStkPollTimer);
    if (instantStkCountdownTimer) clearInterval(instantStkCountdownTimer);

    // Retrieve product from cache or API
    let product = (window._productCache && (window._productCache[productId] || window._productCache[String(productId)])) || null;

    if (!product) {
        try {
            const resp = await fetch(`/api/products/${productId}`);
            if (resp.ok) {
                const data = await resp.json();
                product = data.product || data.data || data;
            }
        } catch (e) {
            console.warn('Error fetching product for instant buy:', e);
        }
    }

    if (!product) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'error', title: 'Product Unavailable', text: 'Could not load product details. Please try again.' });
        } else {
            alert('Product details could not be loaded.');
        }
        return;
    }

    currentInstantProduct = product;

    // Populate modal elements
    const modalEl = document.getElementById('instantBuyModal');
    if (!modalEl) {
        console.error('#instantBuyModal not found in DOM');
        return;
    }

    // Product preview
    const titleEl = document.getElementById('instantProdTitle');
    const catEl = document.getElementById('instantProdCat');
    const priceEl = document.getElementById('instantProdPrice');
    const imgEl = document.getElementById('instantProdImg');
    const stockEl = document.getElementById('instantProdStock');

    const imageSrc = (product.images && Array.isArray(product.images) && product.images[0]) || product.image_url || product.image || 'img/product-1.png';
    const unitPrice = parseFloat(product.price || product.selling_price || 0);

    if (titleEl) titleEl.textContent = product.name || 'Product';
    if (catEl) catEl.textContent = (product.categories && product.categories.name) || product.category || 'General';
    if (priceEl) priceEl.textContent = `KSh ${Math.round(unitPrice).toLocaleString()}`;
    if (imgEl) {
        imgEl.src = imageSrc;
        imgEl.onerror = function () { this.src = 'img/product-1.png'; };
    }
    if (stockEl) {
        const stockCount = typeof product.stock === 'number' ? product.stock : 99;
        stockEl.textContent = stockCount > 0 ? `${stockCount} in stock` : 'Out of stock';
        stockEl.className = stockCount > 0 ? 'badge bg-success bg-opacity-10 text-success' : 'badge bg-danger bg-opacity-10 text-danger';
    }

    // Set Quantity
    const qtyInput = document.getElementById('instantQtyInput');
    if (qtyInput) qtyInput.value = '1';

    // Pre-fill user data if logged in
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const nameInput = document.getElementById('instantCustName');
            const phoneInput = document.getElementById('instantCustPhone');
            if (nameInput && !nameInput.value && (user.name || user.fullName)) {
                nameInput.value = user.name || user.fullName;
            }
            if (phoneInput && !phoneInput.value && user.phone) {
                phoneInput.value = user.phone;
            }
        }
    } catch (e) { }

    // Select default payment mode
    selectInstantPayment('mpesa');

    // Reset STK waiting overlay if visible
    const stkOverlay = document.getElementById('instantStkOverlay');
    if (stkOverlay) stkOverlay.style.display = 'none';

    // Recalculate totals
    updateInstantTotals();

    // Show modal — with robust fallback chain
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
            bsModal.show();
            console.log('✅ Instant Buy modal opened via Bootstrap 5');
        } else if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
            $('#instantBuyModal').modal('show');
            console.log('✅ Instant Buy modal opened via jQuery');
        } else {
            // Vanilla fallback
            modalEl.classList.add('show');
            modalEl.style.display = 'block';
            modalEl.removeAttribute('aria-hidden');
            modalEl.setAttribute('aria-modal', 'true');
            modalEl.setAttribute('role', 'dialog');
            document.body.classList.add('modal-open');
            // Add backdrop
            let backdrop = document.querySelector('.modal-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
            console.log('✅ Instant Buy modal opened via vanilla fallback');
        }
    } catch (modalErr) {
        console.error('❌ Failed to open instant buy modal:', modalErr);
        // Last resort vanilla fallback
        modalEl.classList.add('show');
        modalEl.style.display = 'block';
        document.body.classList.add('modal-open');
    }
}

// Adjust quantity
function adjustInstantQty(delta) {
    if (!currentInstantProduct) return;
    const qtyInput = document.getElementById('instantQtyInput');
    if (!qtyInput) return;

    let qty = parseInt(qtyInput.value, 10) || 1;
    const maxStock = typeof currentInstantProduct.stock === 'number' && currentInstantProduct.stock > 0 ? currentInstantProduct.stock : 999;

    qty = Math.max(1, Math.min(maxStock, qty + delta));
    qtyInput.value = qty;
    currentInstantQty = qty;

    updateInstantTotals();
}

function handleInstantQtyInput(val) {
    if (!currentInstantProduct) return;
    let qty = parseInt(val, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    const maxStock = typeof currentInstantProduct.stock === 'number' && currentInstantProduct.stock > 0 ? currentInstantProduct.stock : 999;
    qty = Math.min(maxStock, qty);
    currentInstantQty = qty;
    updateInstantTotals();
}

// Update total price and button labels
function updateInstantTotals() {
    if (!currentInstantProduct) return;
    const unitPrice = parseFloat(currentInstantProduct.price || currentInstantProduct.selling_price || 0);
    const total = Math.round(unitPrice * currentInstantQty);

    const totalEl = document.getElementById('instantOrderTotal');
    const subtotalEl = document.getElementById('instantOrderSubtotal');
    const payBtnText = document.getElementById('instantPayBtnText');

    if (totalEl) totalEl.textContent = `KSh ${total.toLocaleString()}`;
    if (subtotalEl) subtotalEl.textContent = `KSh ${total.toLocaleString()} (${currentInstantQty} × KSh ${Math.round(unitPrice).toLocaleString()})`;

    if (payBtnText) {
        if (currentInstantPaymentMode === 'mpesa') {
            payBtnText.innerHTML = `⚡ Pay KSh ${total.toLocaleString()} with M-Pesa`;
        } else if (currentInstantPaymentMode === 'whatsapp') {
            payBtnText.innerHTML = `💬 Order via WhatsApp (KSh ${total.toLocaleString()})`;
        } else {
            payBtnText.innerHTML = `✅ Confirm Order (KSh ${total.toLocaleString()})`;
        }
    }
}

// Select payment mode
function selectInstantPayment(mode) {
    currentInstantPaymentMode = mode || 'mpesa';

    // Tiles
    const tileMpesa = document.getElementById('instantTileMpesa');
    const tileCash = document.getElementById('instantTileCash');
    const tileWa = document.getElementById('instantTileWa');

    if (tileMpesa) tileMpesa.classList.toggle('active', mode === 'mpesa');
    if (tileCash) tileCash.classList.toggle('active', mode === 'cash');
    if (tileWa) tileWa.classList.toggle('active', mode === 'whatsapp');

    // Phone field label & hint
    const phoneLabel = document.getElementById('instantPhoneLabel');
    const phoneHint = document.getElementById('instantPhoneHint');

    if (phoneLabel) {
        if (mode === 'mpesa') {
            phoneLabel.innerHTML = 'M-Pesa Phone Number <span class="text-danger">*</span>';
        } else {
            phoneLabel.innerHTML = 'Contact Phone Number <span class="text-danger">*</span>';
        }
    }

    if (phoneHint) {
        if (mode === 'mpesa') {
            phoneHint.textContent = 'Enter phone number that will receive the STK PIN prompt (e.g. 07XXXXXXXX or 01XXXXXXXX).';
        } else {
            phoneHint.textContent = 'Phone number for order updates and confirmation.';
        }
    }

    updateInstantTotals();
}

// Execute Instant Checkout Order
async function executeInstantOrder() {
    if (!currentInstantProduct) {
        alert('No product selected.');
        return;
    }

    const nameInput = document.getElementById('instantCustName');
    const phoneInput = document.getElementById('instantCustPhone');
    const deliveryRadio = document.querySelector('input[name="instantDeliveryType"]:checked');
    const notesInput = document.getElementById('instantOrderNotes');

    const custName = (nameInput?.value || '').trim() || 'Customer';
    let custPhone = (phoneInput?.value || '').trim();
    const deliveryType = deliveryRadio?.value || 'pickup';
    const notes = (notesInput?.value || '').trim();

    if (!custPhone) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'Phone Required', text: 'Please enter your phone number to receive payment prompt/confirmation.' });
        } else {
            alert('Please enter your phone number.');
        }
        phoneInput?.focus();
        return;
    }

    // Normalize phone number for Kenyan formats
    custPhone = custPhone.replace(/[\s\-\+]/g, '');
    if (custPhone.startsWith('0')) {
        custPhone = '254' + custPhone.slice(1);
    } else if (custPhone.startsWith('7') || custPhone.startsWith('1')) {
        custPhone = '254' + custPhone;
    }

    if (!/^254(7|1)\d{8}$/.test(custPhone)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'Invalid Phone Number', text: 'Please enter a valid Safaricom/Airtel phone number (e.g. 0712345678 or 0112345678).' });
        } else {
            alert('Please enter a valid phone number (e.g. 0712345678).');
        }
        phoneInput?.focus();
        return;
    }

    const unitPrice = parseFloat(currentInstantProduct.price || currentInstantProduct.selling_price || 0);
    const totalAmount = Math.round(unitPrice * currentInstantQty);
    const orderRef = `DD-${Date.now().toString().slice(-5)}`;

    // Handle WhatsApp Order
    if (currentInstantPaymentMode === 'whatsapp') {
        const waNumber = '254708374149';
        const msg = `*NEW INSTANT ORDER: ${orderRef}*\n\n` +
            `*Product:* ${currentInstantProduct.name}\n` +
            `*Quantity:* ${currentInstantQty} unit(s)\n` +
            `*Total Price:* KSh ${totalAmount.toLocaleString()}\n\n` +
            `*Customer Name:* ${custName}\n` +
            `*Phone:* ${custPhone}\n` +
            `*Delivery:* ${deliveryType === 'pickup' ? 'Store Pickup (Free)' : 'Direct Delivery'}\n` +
            (notes ? `*Notes:* ${notes}\n` : '') +
            `\nPlease confirm this order. Thank you!`;

        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');

        // Close modal
        const modalEl = document.getElementById('instantBuyModal');
        if (modalEl) {
            safeHideModal(modalEl);
        }
        return;
    }

    // Handle Cash on Pickup / Delivery
    if (currentInstantPaymentMode === 'cash') {
        recordOrder({
            orderNumber: orderRef,
            customerName: custName,
            customerPhone: custPhone,
            deliveryType,
            notes,
            paymentMode: 'CASH ON DELIVERY',
            totalAmount,
            mpesaReceipt: null
        });
        return;
    }

    // Handle M-Pesa STK Push
    if (currentInstantPaymentMode === 'mpesa') {
        await initiateInstantMpesaStk({
            phone: custPhone,
            amount: totalAmount,
            customerName: custName,
            orderRef,
            deliveryType,
            notes
        });
    }
}

// Initiate M-Pesa STK Push with real-time waiting overlay
async function initiateInstantMpesaStk({ phone, amount, customerName, orderRef, deliveryType, notes }) {
    const stkOverlay = document.getElementById('instantStkOverlay');
    const stkPhoneEl = document.getElementById('instantStkPhoneDisplay');
    const stkAmountEl = document.getElementById('instantStkAmountDisplay');
    const stkTimerEl = document.getElementById('instantStkCountdown');
    const stkStatusEl = document.getElementById('instantStkStatusText');

    if (stkOverlay) stkOverlay.style.display = 'flex';
    if (stkPhoneEl) stkPhoneEl.textContent = `+${phone}`;
    if (stkAmountEl) stkAmountEl.textContent = `KSh ${amount.toLocaleString()}`;
    if (stkStatusEl) stkStatusEl.textContent = 'Contacting Safaricom M-Pesa Gateway...';

    // Start 60-second countdown
    let timeLeft = 60;
    if (stkTimerEl) stkTimerEl.textContent = `${timeLeft}s`;
    if (instantStkCountdownTimer) clearInterval(instantStkCountdownTimer);
    instantStkCountdownTimer = setInterval(() => {
        timeLeft--;
        if (stkTimerEl) stkTimerEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(instantStkCountdownTimer);
        }
    }, 1000);

    try {
        const response = await fetch('/api/mpesa/stkpush', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phoneNumber: phone,
                amount: amount,
                accountReference: orderRef,
                transactionDesc: `Denla-${currentInstantProduct.name.slice(0, 15)}`
            })
        });

        const data = await response.json();

        if (data.success && data.CheckoutRequestID) {
            if (stkStatusEl) stkStatusEl.innerHTML = '📲 <strong class="text-success">PIN Prompt Sent!</strong> Please enter your M-Pesa PIN on your phone.';
            pollInstantMpesaStatus(data.CheckoutRequestID, {
                phone,
                amount,
                customerName,
                orderRef,
                deliveryType,
                notes
            });
        } else {
            hideInstantStkOverlay();
            const errMsg = data.message || 'Could not send M-Pesa STK prompt. Please check your phone number and try again.';
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'error', title: 'M-Pesa STK Error', text: errMsg });
            } else {
                alert(errMsg);
            }
        }
    } catch (err) {
        console.error('M-Pesa STK Request Failed:', err);
        hideInstantStkOverlay();
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'error', title: 'Connection Error', text: 'Could not connect to payment gateway. Please retry or choose Cash/WhatsApp.' });
        } else {
            alert('Could not connect to payment gateway.');
        }
    }
}

// Poll payment status
function pollInstantMpesaStatus(checkoutRequestId, orderDetails) {
    if (instantStkPollTimer) clearInterval(instantStkPollTimer);
    let attempts = 0;
    const maxAttempts = 24; // 60 seconds

    instantStkPollTimer = setInterval(async () => {
        attempts++;
        try {
            const res = await fetch(`/api/mpesa/status/${encodeURIComponent(checkoutRequestId)}`);
            const data = await res.json();

            if (data.success && data.status === 'completed') {
                clearInterval(instantStkPollTimer);
                clearInterval(instantStkCountdownTimer);
                hideInstantStkOverlay();

                // Successful payment!
                const mpesaReceipt = data.mpesaReceiptNumber || `MP${Date.now().toString().slice(-8)}`;
                recordOrder({
                    ...orderDetails,
                    paymentMode: 'M-PESA STK PUSH',
                    mpesaReceipt: mpesaReceipt
                });
            } else if (data.status === 'failed' || attempts >= maxAttempts) {
                clearInterval(instantStkPollTimer);
                clearInterval(instantStkCountdownTimer);
                hideInstantStkOverlay();

                if (data.status === 'failed') {
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({ icon: 'warning', title: 'Payment Incomplete', text: data.resultDesc || 'M-Pesa transaction was cancelled or timed out.' });
                    } else {
                        alert(data.resultDesc || 'Transaction was cancelled.');
                    }
                }
            }
        } catch (e) {
            if (attempts >= maxAttempts) {
                clearInterval(instantStkPollTimer);
                clearInterval(instantStkCountdownTimer);
                hideInstantStkOverlay();
            }
        }
    }, 2500);
}

function hideInstantStkOverlay() {
    const stkOverlay = document.getElementById('instantStkOverlay');
    if (stkOverlay) stkOverlay.style.display = 'none';
    if (instantStkCountdownTimer) clearInterval(instantStkCountdownTimer);
    if (instantStkPollTimer) clearInterval(instantStkPollTimer);
}

function cancelInstantStk() {
    hideInstantStkOverlay();
}

// Record completed order & show receipt
function recordOrder({ orderNumber, customerName, customerPhone, deliveryType, notes, paymentMode, totalAmount, mpesaReceipt }) {
    // Hide Buy Modal
    const buyModalEl = document.getElementById('instantBuyModal');
    if (buyModalEl) {
        safeHideModal(buyModalEl);
    }

    // Populate Receipt Modal
    const rcptModalEl = document.getElementById('instantReceiptModal');
    if (!rcptModalEl) return;

    const rcptNum = document.getElementById('instantRcptNumber');
    const rcptDate = document.getElementById('instantRcptDate');
    const rcptCust = document.getElementById('instantRcptCustomer');
    const rcptPhone = document.getElementById('instantRcptPhone');
    const rcptMethod = document.getElementById('instantRcptPayMethod');
    const rcptCode = document.getElementById('instantRcptCode');
    const rcptItems = document.getElementById('instantRcptItems');
    const rcptTotal = document.getElementById('instantRcptTotal');
    const rcptDelivery = document.getElementById('instantRcptDelivery');

    const now = new Date();
    const dateStr = now.toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });

    if (rcptNum) rcptNum.textContent = orderNumber;
    if (rcptDate) rcptDate.textContent = dateStr;
    if (rcptCust) rcptCust.textContent = customerName;
    if (rcptPhone) rcptPhone.textContent = `+${customerPhone}`;
    if (rcptMethod) rcptMethod.textContent = paymentMode;
    if (rcptCode) {
        rcptCode.textContent = mpesaReceipt ? `Receipt #${mpesaReceipt}` : 'Pending Confirmation';
        rcptCode.className = mpesaReceipt ? 'badge bg-success' : 'badge bg-warning text-dark';
    }
    if (rcptDelivery) rcptDelivery.textContent = deliveryType === 'pickup' ? 'Store Pickup (Denla Discount Store)' : 'Direct Delivery';

    if (rcptItems && currentInstantProduct) {
        const unitPrice = parseFloat(currentInstantProduct.price || currentInstantProduct.selling_price || 0);
        rcptItems.innerHTML = `
            <tr>
                <td>
                    <strong>${currentInstantProduct.name}</strong>
                    <div class="small text-muted">Unit: KSh ${Math.round(unitPrice).toLocaleString()}</div>
                </td>
                <td class="text-center fw-bold">${currentInstantQty}</td>
                <td class="text-end fw-bold">KSh ${totalAmount.toLocaleString()}</td>
            </tr>
        `;
    }

    if (rcptTotal) rcptTotal.textContent = `KSh ${totalAmount.toLocaleString()}`;

    // Show Receipt Modal
    safeShowModal(rcptModalEl);
}

// Print / Download Receipt
function printInstantReceipt() {
    window.print();
}

// Export functions to global scope
window.openInstantBuyModal = openInstantBuyModal;
window.adjustInstantQty = adjustInstantQty;
window.handleInstantQtyInput = handleInstantQtyInput;
window.selectInstantPayment = selectInstantPayment;
window.executeInstantOrder = executeInstantOrder;
window.cancelInstantStk = cancelInstantStk;
window.printInstantReceipt = printInstantReceipt;
