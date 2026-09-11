# 🧪 Testing M-Pesa Integration - Complete Guide

## Quick Test (Using Mock Server)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Mock M-Pesa Server
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════╗
║   MOCK M-PESA API SERVER                       ║
║   Running on http://localhost:5000             ║
╚════════════════════════════════════════════════╝
```

### Step 3: Open Frontend
1. Open `cheackout.html` in your browser
2. Make sure you have items in cart (add from `shop.html`)

### Step 4: Test M-Pesa Payment
1. **Fill billing details:**
   - First Name: `John`
   - Last Name: `Doe`
   - Phone: `0712345678`
   - Email: `john@example.com`
   - County: `Nairobi`
   - City: `Nairobi`
   - Address: `123 Test Street`

2. **Select M-Pesa payment method** (should be selected by default)

3. **Enter M-Pesa phone number:**
   - Use format: `254712345678`
   - Or: `0712345678` (auto-converts to 254712345678)

4. **Click "Place Order Securely"**

5. **Watch the payment flow:**
   ```
   ✅ Form validates
   ✅ Modal appears: "Processing Payment..."
   ✅ Modal updates: "Check your phone for M-Pesa prompt"
   ✅ Backend simulates payment (5 seconds)
   ✅ Frontend polls for status every 2 seconds
   ✅ Success modal appears with receipt number
   ✅ Cart is cleared
   ```

---

## Testing Different Scenarios

### 1. Successful Payment ✅
```
Phone: 254712345678
Amount: Any valid amount
Expected: Payment completes after 5 seconds
Result: Success modal with receipt number
```

### 2. Invalid Phone Number ❌
```
Phone: 123456789 (invalid)
Expected: Validation error before submission
Result: Red border on phone input + error message
```

### 3. Payment Timeout ⏰
```
The mock server has 90% success rate
10% of payments will randomly fail
Expected: Failure modal with reason
Result: User can try again
```

### 4. Network Error 🌐
```
Stop the mock server (Ctrl+C)
Try to place order
Expected: Error message
Result: "Failed to place order. Please try again."
```

---

## Mock Server Features

### Auto-Completion
- Payments auto-complete after **5 seconds**
- 90% success rate
- 10% random failures (simulating real-world scenarios)

### Random Failure Scenarios
The mock server randomly simulates these M-Pesa errors:
- `1` - Insufficient Balance
- `1032` - Request cancelled by user
- `1037` - Timeout (user unreachable)
- `2001` - Wrong PIN entered

### Console Logging
Watch the server console for real-time updates:
```
📱 MOCK STK PUSH INITIATED
Phone: 254712345678
Amount: KSh 1500
Reference: ORDER-1234567890
CheckoutRequestID: ws_CO_20231219113352524545

✅ MOCK PAYMENT SUCCESSFUL
Receipt: MOCK12345678
CheckoutRequestID: ws_CO_20231219113352524545
```

---

## Frontend Testing Checklist

### Before Payment
- [ ] Cart has items
- [ ] Billing form validates all required fields
- [ ] Email format is validated
- [ ] Phone number auto-formats (0712... → 254712...)
- [ ] M-Pesa phone section appears when M-Pesa selected
- [ ] M-Pesa phone section hides when COD/Bank Transfer selected

### During Payment
- [ ] Loading spinner shows
- [ ] Modal opens with "Processing Payment..."
- [ ] Modal updates to "Check your phone..."
- [ ] Status is polled every 2 seconds
- [ ] Console shows API calls

### After Success
- [ ] Success modal appears
- [ ] Receipt number is displayed
- [ ] Transaction ID is shown
- [ ] "Continue Shopping" button works
- [ ] Cart is cleared
- [ ] localStorage 'awesomeTech_cart' is empty

### After Failure
- [ ] Failure modal appears
- [ ] Error reason is displayed
- [ ] Common reasons list is shown
- [ ] "Try Again" button closes modal
- [ ] Cart is NOT cleared
- [ ] User can retry payment

---

## Browser Console Testing

### Open Browser DevTools (F12)

#### Check Network Tab
1. Filter by "Fetch/XHR"
2. Look for these requests:
   ```
   POST /api/mpesa/stkpush
   GET /api/mpesa/status/{checkoutRequestId}
   POST /api/orders (after payment success)
   ```

#### Check Console Tab
Look for these logs:
```javascript
📱 MOCK STK PUSH INITIATED
Phone: 254712345678
Amount: KSh 1500

// Every 2 seconds:
📊 STATUS CHECK: ws_CO_... - pending
📊 STATUS CHECK: ws_CO_... - pending
📊 STATUS CHECK: ws_CO_... - completed

✅ MOCK PAYMENT SUCCESSFUL
Receipt: MOCK12345678
```

---

## Advanced Testing

### Test with cURL

#### 1. Test STK Push
```bash
curl -X POST http://localhost:5000/api/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -d "{
    \"phoneNumber\": \"254712345678\",
    \"amount\": 1500,
    \"accountReference\": \"TEST-ORDER-001\",
    \"transactionDesc\": \"Test Payment\"
  }"
```

**Expected Response:**
```json
{
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing",
  "MerchantRequestID": "MOCK-1234567890-abc123",
  "CheckoutRequestID": "ws_CO_20231219113352524545",
  "CustomerMessage": "Success. Request accepted for processing"
}
```

#### 2. Check Status
```bash
# Replace with actual CheckoutRequestID from step 1
curl http://localhost:5000/api/mpesa/status/ws_CO_20231219113352524545
```

**Response (Pending):**
```json
{
  "success": true,
  "resultCode": null,
  "resultDesc": null,
  "mpesaReceiptNumber": null,
  "transactionId": "ws_CO_20231219113352524545",
  "status": "pending"
}
```

**Response (After 5 seconds - Completed):**
```json
{
  "success": true,
  "resultCode": "0",
  "resultDesc": "The service request is processed successfully.",
  "mpesaReceiptNumber": "MOCK12345678",
  "transactionId": "ws_CO_20231219113352524545",
  "status": "completed"
}
```

#### 3. Force Success/Failure (Test Endpoint)
```bash
# Force success
curl -X POST http://localhost:5000/api/test/complete/ws_CO_20231219113352524545 \
  -H "Content-Type: application/json" \
  -d '{"success": true}'

# Force failure
curl -X POST http://localhost:5000/api/test/complete/ws_CO_20231219113352524545 \
  -H "Content-Type: application/json" \
  -d '{"success": false}'
```

---

## Testing with Postman

### 1. Import Collection

Create new Postman collection with these requests:

#### Request 1: STK Push
```
Method: POST
URL: http://localhost:5000/api/mpesa/stkpush
Headers: Content-Type: application/json
Body (JSON):
{
  "phoneNumber": "254712345678",
  "amount": 1500,
  "accountReference": "TEST-ORDER-001",
  "transactionDesc": "Test Payment"
}
```

#### Request 2: Check Status
```
Method: GET
URL: http://localhost:5000/api/mpesa/status/{{checkoutRequestId}}
Note: Use checkoutRequestId from Request 1 response
```

#### Request 3: Health Check
```
Method: GET
URL: http://localhost:5000/api/health
```

---

## Common Issues & Solutions

### Issue 1: "Cannot GET /" when accessing http://localhost:5000
**Solution:** The mock server only has API endpoints, not a homepage. Use:
- http://localhost:5000/api/health

### Issue 2: "CORS error" in browser
**Solution:** Mock server has CORS enabled. If still getting error:
1. Check if server is running
2. Verify API_BASE_URL in `cheackout.html` is `http://localhost:5000/api`

### Issue 3: Modal doesn't appear
**Solution:**
1. Check if Bootstrap is loaded (check console for errors)
2. Verify modal HTML exists in `cheackout.html` (search for `mpesaStatusModal`)
3. Check if `showMpesaStatus()` function is defined

### Issue 4: Payment stays "pending" forever
**Solution:**
1. Wait at least 5 seconds (mock server delay)
2. Check server console for completion message
3. Manually check status with cURL
4. Verify polling is working (check Network tab)

### Issue 5: "Transaction not found"
**Solution:**
1. Verify you're using correct CheckoutRequestID
2. Mock server stores in memory - restart = data loss
3. Create new transaction

---

## Performance Testing

### Test Rapid Submissions
1. Open multiple tabs with checkout page
2. Submit orders simultaneously
3. Verify each gets unique CheckoutRequestID
4. All should complete independently

### Test Timeout Handling
1. Set longer delay in mock server (change 5000 to 65000)
2. Submit payment
3. Should timeout after 30 attempts (60 seconds)
4. Verify timeout error is shown

---

## Production Testing Checklist

### Before Going Live
- [ ] Replace mock server with real backend
- [ ] Test with Safaricom sandbox credentials
- [ ] Test with real phone numbers
- [ ] Verify HTTPS callback URL works
- [ ] Test actual STK Push on phone
- [ ] Verify database records are created
- [ ] Test email/SMS notifications
- [ ] Test payment reconciliation
- [ ] Load test with multiple concurrent payments
- [ ] Test all error scenarios
- [ ] Verify logging is working
- [ ] Test callback handling
- [ ] Verify transaction status updates
- [ ] Test refund/reversal flow (if applicable)

---

## Debugging Tips

### Enable Verbose Logging
Add this to `cheackout.html` before M-Pesa functions:
```javascript
const DEBUG = true;
function log(...args) {
    if (DEBUG) console.log('[M-Pesa]', ...args);
}
```

Then use:
```javascript
log('Initiating STK Push:', orderData);
log('Polling attempt:', attempts);
log('Payment status:', status);
```

### Monitor LocalStorage
In browser console:
```javascript
// Check cart
JSON.parse(localStorage.getItem('awesomeTech_cart'))

// Clear cart manually
localStorage.removeItem('awesomeTech_cart')

// Check auth
localStorage.getItem('awesomeTech_token')
```

### Network Throttling
1. Open DevTools → Network tab
2. Select "Slow 3G" from dropdown
3. Test payment flow with poor connection
4. Verify timeout handling works

---

## Test Results Template

```
Date: _______________
Tester: _______________

✅ Frontend Validation
  [ ] Phone number format validation
  [ ] Amount validation
  [ ] Required fields validation

✅ STK Push Initiation
  [ ] Request sent successfully
  [ ] Correct payload format
  [ ] Response received

✅ Payment Processing
  [ ] Modal displays correctly
  [ ] Status polling works
  [ ] Success scenario tested
  [ ] Failure scenario tested
  [ ] Timeout scenario tested

✅ Post-Payment
  [ ] Order created in database
  [ ] Cart cleared
  [ ] Receipt displayed
  [ ] Redirect works

❌ Issues Found:
1. _______________________________
2. _______________________________
3. _______________________________

Notes:
_____________________________________
_____________________________________
```

---

## Next Steps After Testing

1. **All tests pass?** → Implement real backend using `MPESA_BACKEND_GUIDE.md`
2. **Found bugs?** → Fix and re-test
3. **Ready for production?** → Get Safaricom production credentials
4. **Going live?** → Follow production checklist

---

**Happy Testing! 🧪✨**
