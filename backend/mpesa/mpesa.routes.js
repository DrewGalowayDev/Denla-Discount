const express = require('express');
const router = express.Router();
const mpesaService = require('./mpesa.service');
const mpesaModel = require('./mpesa.model');

/**
 * @route   POST /api/mpesa/stkpush
 * @desc    Initiate M-Pesa STK Push payment
 * @access  Public
 */
router.post('/stkpush', async (req, res) => {
    try {
        const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

        // Validate input
        if (!phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and amount are required'
            });
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be at least 1 KSh'
            });
        }

        // Format and validate phone number
        const formattedPhone = mpesaService.formatPhoneNumber(phoneNumber);
        const phoneRegex = /^254[0-9]{9}$/;
        if (!phoneRegex.test(formattedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format. Use 254XXXXXXXXX'
            });
        }

        // Initiate STK Push
        const result = await mpesaService.stkPush(
            formattedPhone,
            amountNum,
            accountReference || `ORDER-${Date.now()}`,
            transactionDesc || 'Awesome Tech Purchase'
        );

        // Save transaction to database
        if (result.ResponseCode === '0') {
            await mpesaModel.createTransaction({
                merchantRequestId: result.MerchantRequestID,
                checkoutRequestId: result.CheckoutRequestID,
                phoneNumber: formattedPhone,
                amount: amountNum,
                accountReference: accountReference || `ORDER-${Date.now()}`,
                transactionDesc: transactionDesc || 'Awesome Tech Purchase'
            });

            res.json({
                success: true,
                ...result
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.ResponseDescription || 'Failed to initiate payment',
                ...result
            });
        }
    } catch (error) {
        console.error('STK Push Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to initiate M-Pesa payment'
        });
    }
});

/**
 * @route   POST /api/mpesa/callback
 * @desc    M-Pesa callback endpoint
 * @access  Public (called by Safaricom)
 */
router.post('/callback', async (req, res) => {
    try {
        console.log('📥 M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));

        // Validate and extract callback data
        const callbackData = mpesaService.validateCallback(req.body);

        const {
            checkoutRequestId,
            resultCode,
            resultDesc,
            mpesaReceiptNumber,
            transactionDate,
            phoneNumber,
            amount
        } = callbackData;

        // Determine status
        const status = resultCode === 0 ? 'completed' : 'failed';

        // Update transaction in database
        await mpesaModel.updateTransaction(checkoutRequestId, {
            status,
            result_code: resultCode.toString(),
            result_desc: resultDesc,
            mpesa_receipt_number: mpesaReceiptNumber,
            transaction_date: transactionDate,
            callback_received_at: new Date().toISOString()
        });

        console.log(`${status === 'completed' ? '✅' : '❌'} M-Pesa Payment ${status}:`, {
            checkoutRequestId,
            resultCode,
            mpesaReceiptNumber
        });

        // Acknowledge callback
        res.json({
            ResultCode: 0,
            ResultDesc: 'Success'
        });
    } catch (error) {
        console.error('❌ Callback Error:', error);
        res.status(500).json({
            ResultCode: 1,
            ResultDesc: 'Failed to process callback'
        });
    }
});

/**
 * @route   POST /api/mpesa/timeout
 * @desc    M-Pesa timeout endpoint
 * @access  Public (called by Safaricom)
 */
router.post('/timeout', async (req, res) => {
    try {
        console.log('⏰ M-Pesa Timeout:', JSON.stringify(req.body, null, 2));

        // Acknowledge timeout
        res.json({
            ResultCode: 0,
            ResultDesc: 'Timeout received'
        });
    } catch (error) {
        console.error('❌ Timeout Error:', error);
        res.status(500).json({
            ResultCode: 1,
            ResultDesc: 'Failed'
        });
    }
});

/**
 * @route   GET /api/mpesa/status/:checkoutRequestId
 * @desc    Query transaction status
 * @access  Public
 */
router.get('/status/:checkoutRequestId', async (req, res) => {
    try {
        const { checkoutRequestId } = req.params;

        // Check database first
        const transaction = await mpesaModel.getByCheckoutRequestId(checkoutRequestId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // If still pending, query Safaricom
        if (transaction.status === 'pending') {
            try {
                const result = await mpesaService.queryTransaction(checkoutRequestId);
                
                // Update database with query result
                if (result.ResultCode === '0') {
                    await mpesaModel.updateTransaction(checkoutRequestId, {
                        status: 'completed',
                        result_code: result.ResultCode,
                        result_desc: result.ResultDesc
                    });
                    
                    transaction.status = 'completed';
                    transaction.result_code = result.ResultCode;
                }
            } catch (queryError) {
                console.error('Query error:', queryError.message);
                // Continue with database status
            }
        }

        res.json({
            success: true,
            resultCode: transaction.result_code?.toString() || null,
            resultDesc: transaction.result_desc,
            mpesaReceiptNumber: transaction.mpesa_receipt_number,
            transactionId: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            phoneNumber: transaction.phone_number,
            createdAt: transaction.created_at
        });
    } catch (error) {
        console.error('Status Query Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to query transaction status'
        });
    }
});

/**
 * @route   GET /api/mpesa/transactions/:phoneNumber
 * @desc    Get transaction history for a phone number
 * @access  Public
 */
router.get('/transactions/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const formattedPhone = mpesaService.formatPhoneNumber(phoneNumber);
        const transactions = await mpesaModel.getByPhoneNumber(formattedPhone, limit);

        res.json({
            success: true,
            count: transactions.length,
            transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions'
        });
    }
});

/**
 * @route   GET /api/mpesa/stats
 * @desc    Get M-Pesa transaction statistics
 * @access  Private (add auth middleware)
 */
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const stats = await mpesaModel.getStats(startDate, endDate);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

module.exports = router;
