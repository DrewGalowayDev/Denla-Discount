/**
 * MOCK M-PESA API SERVER
 * For testing M-Pesa integration without actual Daraja API credentials
 * 
 * This simulates M-Pesa STK Push and callback responses
 * Use this ONLY for testing - implement real backend before production!
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory storage for mock transactions
const transactions = new Map();

// Mock STK Push endpoint
app.post('/api/mpesa/stkpush', (req, res) => {
    const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

    // Validate phone number
    const phoneRegex = /^254[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
        return res.status(400).json({
            ResponseCode: '500.001.1001',
            ResponseDescription: 'Invalid phone number',
            errorMessage: 'Phone number must be in format 254XXXXXXXXX'
        });
    }

    // Validate amount
    if (!amount || amount < 1) {
        return res.status(400).json({
            ResponseCode: '400.002.02',
            ResponseDescription: 'Bad Request - Invalid Amount',
            errorMessage: 'Amount must be at least 1 KSh'
        });
    }

    // Generate mock IDs
    const merchantRequestId = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const checkoutRequestId = `ws_CO_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}${Math.floor(Math.random() * 1000000)}`;

    // Store mock transaction
    transactions.set(checkoutRequestId, {
        merchantRequestId,
        checkoutRequestId,
        phoneNumber,
        amount,
        accountReference,
        transactionDesc,
        status: 'pending',
        createdAt: Date.now()
    });

    console.log(`\n📱 MOCK STK PUSH INITIATED`);
    console.log(`Phone: ${phoneNumber}`);
    console.log(`Amount: KSh ${amount}`);
    console.log(`Reference: ${accountReference}`);
    console.log(`CheckoutRequestID: ${checkoutRequestId}\n`);

    // Simulate STK Push acceptance
    res.json({
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        MerchantRequestID: merchantRequestId,
        CheckoutRequestID: checkoutRequestId,
        CustomerMessage: 'Success. Request accepted for processing'
    });

    // Simulate payment completion after 5 seconds
    setTimeout(() => {
        const transaction = transactions.get(checkoutRequestId);
        
        if (transaction) {
            // Simulate successful payment (90% success rate)
            const isSuccess = Math.random() > 0.1;
            
            if (isSuccess) {
                transaction.status = 'completed';
                transaction.resultCode = '0';
                transaction.resultDesc = 'The service request is processed successfully.';
                transaction.mpesaReceiptNumber = `MOCK${Date.now().toString().slice(-8)}`;
                transaction.transactionDate = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
                
                console.log(`✅ MOCK PAYMENT SUCCESSFUL`);
                console.log(`Receipt: ${transaction.mpesaReceiptNumber}`);
                console.log(`CheckoutRequestID: ${checkoutRequestId}\n`);
            } else {
                // Simulate random failure
                const failures = [
                    { code: '1', desc: 'Insufficient Balance' },
                    { code: '1032', desc: 'Request cancelled by user' },
                    { code: '1037', desc: 'DS timeout user cannot be reached' },
                    { code: '2001', desc: 'Wrong PIN' }
                ];
                const failure = failures[Math.floor(Math.random() * failures.length)];
                
                transaction.status = 'failed';
                transaction.resultCode = failure.code;
                transaction.resultDesc = failure.desc;
                
                console.log(`❌ MOCK PAYMENT FAILED`);
                console.log(`Reason: ${failure.desc}`);
                console.log(`CheckoutRequestID: ${checkoutRequestId}\n`);
            }
            
            transactions.set(checkoutRequestId, transaction);
        }
    }, 5000); // 5 seconds delay
});

// Mock status query endpoint
app.get('/api/mpesa/status/:checkoutRequestId', (req, res) => {
    const { checkoutRequestId } = req.params;
    
    const transaction = transactions.get(checkoutRequestId);
    
    if (!transaction) {
        return res.status(404).json({
            success: false,
            message: 'Transaction not found'
        });
    }

    console.log(`📊 STATUS CHECK: ${checkoutRequestId} - ${transaction.status}`);

    res.json({
        success: true,
        resultCode: transaction.resultCode || null,
        resultDesc: transaction.resultDesc || null,
        mpesaReceiptNumber: transaction.mpesaReceiptNumber || null,
        transactionId: checkoutRequestId,
        status: transaction.status
    });
});

// Mock callback endpoint (for testing)
app.post('/api/mpesa/callback', (req, res) => {
    console.log('\n📥 CALLBACK RECEIVED:', JSON.stringify(req.body, null, 2));
    
    res.json({
        ResultCode: 0,
        ResultDesc: 'Success'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Mock M-Pesa API Server Running',
        transactions: transactions.size
    });
});

// Test endpoint to force success/failure
app.post('/api/test/complete/:checkoutRequestId', (req, res) => {
    const { checkoutRequestId } = req.params;
    const { success } = req.body;
    
    const transaction = transactions.get(checkoutRequestId);
    
    if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (success) {
        transaction.status = 'completed';
        transaction.resultCode = '0';
        transaction.resultDesc = 'The service request is processed successfully.';
        transaction.mpesaReceiptNumber = `MOCK${Date.now().toString().slice(-8)}`;
    } else {
        transaction.status = 'failed';
        transaction.resultCode = '1032';
        transaction.resultDesc = 'Request cancelled by user';
    }
    
    transactions.set(checkoutRequestId, transaction);
    
    res.json({ success: true, transaction });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   MOCK M-PESA API SERVER                       ║
║   Running on http://localhost:${PORT}           ║
╚════════════════════════════════════════════════╝

📍 Endpoints:
   POST   /api/mpesa/stkpush
   GET    /api/mpesa/status/:checkoutRequestId
   POST   /api/mpesa/callback
   GET    /api/health

⚠️  This is a MOCK server for testing only!
    Implement real Daraja API before production.

🧪 Test Flow:
   1. Frontend sends STK Push request
   2. Server responds immediately with CheckoutRequestID
   3. After 5 seconds, payment auto-completes
   4. Frontend polls /status endpoint
   5. Status changes from 'pending' to 'completed'/'failed'

📱 Use any 254XXXXXXXXX phone number for testing
💰 Payments auto-complete after 5 seconds (90% success rate)
    `);
});
