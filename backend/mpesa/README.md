# M-Pesa Payment Integration

Production-ready M-Pesa STK Push integration for Awesome Technologies.

## 📁 File Structure

```
backend/mpesa/
├── mpesa.service.js    # M-Pesa API service (Daraja API integration)
├── mpesa.model.js      # Database operations (Supabase)
├── mpesa.routes.js     # Express routes/endpoints
├── schema.sql          # Supabase database schema
└── README.md           # This file
```

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd backend
npm install axios moment
```

### 2. Configure Environment Variables
Add to `backend/.env`:
```env
# M-Pesa Daraja API Configuration
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_ENVIRONMENT=sandbox
MPESA_BASE_URL_SANDBOX=https://sandbox.safaricom.co.ke
MPESA_BASE_URL_PRODUCTION=https://api.safaricom.co.ke
MPESA_CALLBACK_URL=http://localhost:5000/api/mpesa/callback
MPESA_TIMEOUT_URL=http://localhost:5000/api/mpesa/timeout
```

### 3. Create Database Table
1. Go to your Supabase Dashboard
2. Open SQL Editor
3. Copy and run `schema.sql`

### 4. Routes are Auto-Loaded
The M-Pesa routes are already integrated in `server.js`:
```javascript
app.use('/api/mpesa', mpesaRoutes);
```

## 📡 API Endpoints

### 1. Initiate STK Push
```http
POST /api/mpesa/stkpush
Content-Type: application/json

{
  "phoneNumber": "254712345678",
  "amount": 1500,
  "accountReference": "ORDER-123",
  "transactionDesc": "Product Purchase"
}
```

**Response:**
```json
{
  "success": true,
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing",
  "MerchantRequestID": "29115-34620561-1",
  "CheckoutRequestID": "ws_CO_191220211133524545",
  "CustomerMessage": "Success. Request accepted for processing"
}
```

### 2. Check Payment Status
```http
GET /api/mpesa/status/:checkoutRequestId
```

**Response:**
```json
{
  "success": true,
  "resultCode": "0",
  "resultDesc": "The service request is processed successfully.",
  "mpesaReceiptNumber": "PHR123456",
  "transactionId": 789,
  "status": "completed",
  "amount": 1500,
  "phoneNumber": "254712345678",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 3. M-Pesa Callback (Safaricom calls this)
```http
POST /api/mpesa/callback
```

### 4. Get Transaction History
```http
GET /api/mpesa/transactions/:phoneNumber?limit=10
```

### 5. Get Statistics
```http
GET /api/mpesa/stats?startDate=2024-01-01&endDate=2024-12-31
```

## 🔧 Usage Example

### Frontend JavaScript
```javascript
// Initiate payment
async function initiatePayment(phone, amount) {
  const response = await fetch('http://localhost:5000/api/mpesa/stkpush', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber: phone,
      amount: amount,
      accountReference: `ORDER-${Date.now()}`,
      transactionDesc: 'Awesome Tech Purchase'
    })
  });
  
  const data = await response.json();
  return data.CheckoutRequestID;
}

// Check status
async function checkStatus(checkoutRequestId) {
  const response = await fetch(
    `http://localhost:5000/api/mpesa/status/${checkoutRequestId}`
  );
  return await response.json();
}

// Poll for payment completion
async function waitForPayment(checkoutRequestId) {
  for (let i = 0; i < 30; i++) {
    const status = await checkStatus(checkoutRequestId);
    
    if (status.status === 'completed') {
      return { success: true, ...status };
    } else if (status.status === 'failed') {
      return { success: false, ...status };
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return { success: false, message: 'Timeout' };
}
```

## 🧪 Testing

### Using cURL
```bash
# Test STK Push
curl -X POST http://localhost:5000/api/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 1,
    "accountReference": "TEST-001",
    "transactionDesc": "Test Payment"
  }'

# Check status
curl http://localhost:5000/api/mpesa/status/ws_CO_191220211133524545
```

### Test Phone Numbers (Sandbox)
- `254708374149` - Auto-completes
- `254711111111` - Test number

## 📊 Database Schema

The `mpesa_transactions` table stores:
- Transaction details (phone, amount, reference)
- M-Pesa IDs (merchant request, checkout request)
- Status (pending, completed, failed)
- M-Pesa receipt number
- Timestamps

## 🔐 Security Notes

1. **Environment Variables:** Never commit `.env` file
2. **HTTPS Required:** Production callback URL must be HTTPS
3. **RLS Enabled:** Supabase Row Level Security is enabled
4. **Validation:** All inputs are validated before processing

## 🚀 Production Deployment

### 1. Get Production Credentials
- Go to https://developer.safaricom.co.ke/
- Create production app
- Get Consumer Key, Consumer Secret, Passkey
- Get your production shortcode

### 2. Update Environment
```env
MPESA_ENVIRONMENT=production
MPESA_SHORTCODE=your_production_shortcode
MPESA_CONSUMER_KEY=production_key
MPESA_CONSUMER_SECRET=production_secret
MPESA_PASSKEY=production_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

### 3. Configure HTTPS
- M-Pesa requires HTTPS callback URL
- Use SSL certificate on your server
- Update callback URL to HTTPS

### 4. Test with Real Money
- Start with small amounts (1 KSh)
- Test all scenarios
- Monitor logs

## 📝 Error Handling

Common M-Pesa error codes:
- `0` - Success
- `1` - Insufficient balance
- `1032` - Request cancelled by user
- `1037` - Timeout (user didn't enter PIN)
- `2001` - Wrong PIN entered

## 📞 Support

- **Safaricom API Support:** apisupport@safaricom.co.ke
- **Documentation:** https://developer.safaricom.co.ke/Documentation
- **Portal:** https://developer.safaricom.co.ke/

## ✅ Checklist

Before going live:
- [ ] Production credentials configured
- [ ] Database table created
- [ ] HTTPS configured
- [ ] Callback URL updated
- [ ] Tested with sandbox
- [ ] Tested with production (small amounts)
- [ ] Error handling verified
- [ ] Logs configured
- [ ] Monitoring setup

---

**Status:** Production Ready ✅  
**Port:** Uses backend server port (5000) - No conflict!  
**Database:** Supabase  
**Framework:** Express.js
