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
 * @route   POST /api/mpesa/callback and /api/mpesa/stk/callback
 * @desc    M-Pesa STK callback endpoint
 * @access  Public (called by Safaricom)
 */
const handleStkCallback = async (req, res) => {
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

        // Trigger Auto B2B Settlement to Admin's configured account
        if (status === 'completed' && amount) {
            mpesaService.settleToAdmin({
                amount,
                receiptNumber: mpesaReceiptNumber,
                orderRef: checkoutRequestId
            }).catch(e => console.warn('Settlement notice:', e.message));
        }

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
};

router.post('/callback', handleStkCallback);
router.post('/stk/callback', handleStkCallback);

/**
 * @route   POST /api/mpesa/timeout and /api/mpesa/stk/timeout
 * @desc    M-Pesa timeout endpoint
 * @access  Public (called by Safaricom)
 */
const handleTimeout = async (req, res) => {
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
};

router.post('/timeout', handleTimeout);
router.post('/stk/timeout', handleTimeout);

/**
 * @route   POST /api/mpesa/b2c/result & /api/mpesa/b2c/timeout
 */
router.post('/b2c/result', async (req, res) => {
    console.log('📥 M-Pesa B2C Result:', JSON.stringify(req.body, null, 2));
    res.json({ ResultCode: 0, ResultDesc: 'B2C Result Received' });
});

router.post('/b2c/timeout', async (req, res) => {
    console.log('⏰ M-Pesa B2C Timeout:', JSON.stringify(req.body, null, 2));
    res.json({ ResultCode: 0, ResultDesc: 'B2C Timeout Received' });
});

/**
 * @route   POST /api/mpesa/b2b/result & /api/mpesa/b2b/timeout
 */
router.post('/b2b/result', async (req, res) => {
    console.log('📥 M-Pesa B2B Result:', JSON.stringify(req.body, null, 2));
    res.json({ ResultCode: 0, ResultDesc: 'B2B Result Received' });
});

router.post('/b2b/timeout', async (req, res) => {
    console.log('⏰ M-Pesa B2B Timeout:', JSON.stringify(req.body, null, 2));
    res.json({ ResultCode: 0, ResultDesc: 'B2B Timeout Received' });
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
/**
 * @route   POST /api/mpesa/b2b/transfer
 * @desc    Initiate B2B transfer to settle funds to admin Paybill/Till/Bank
 * @access  Admin
 */
router.post('/b2b/transfer', async (req, res) => {
    try {
        const { amount, destinationShortcode, destinationType, accountReference, remarks } = req.body;

        if (!amount || !destinationShortcode) {
            return res.status(400).json({
                success: false,
                message: 'Amount and destination shortcode (Paybill/Till) are required'
            });
        }

        const result = await mpesaService.b2bTransfer({
            amount,
            destinationShortcode,
            destinationType: destinationType || 'CustomerPayBillOnline',
            accountReference: accountReference || 'Settlement',
            remarks: remarks || 'Store Payout'
        });

        res.json({
            success: true,
            message: 'B2B transfer request sent successfully',
            data: result
        });
    } catch (error) {
        console.error('B2B Transfer Route Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'B2B transfer failed'
        });
    }
});

/**
 * @route   GET /api/mpesa/settings
 * @desc    Get current M-Pesa settlement and integration settings
 * @access  Public / Admin
 */
router.get('/settings', async (req, res) => {
    try {
        const config = await mpesaService.getConfig();
        const { query } = require('../config/database');
        
        let customSettlement = {};
        try {
            const rows = await query(`SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('settlement_shortcode', 'settlement_type', 'settlement_account_ref', 'auto_settlement_enabled')`);
            if (rows && Array.isArray(rows)) {
                rows.forEach(r => { customSettlement[r.setting_key] = r.setting_value; });
            }
        } catch (e) {}

        res.json({
            success: true,
            settings: {
                shortcode: config.shortcode,
                environment: config.environment,
                transactionType: config.transactionType,
                callbackURL: config.callbackURL,
                settlementShortcode: customSettlement.settlement_shortcode || config.shortcode,
                settlementType: customSettlement.settlement_type || config.transactionType,
                settlementAccountRef: customSettlement.settlement_account_ref || '',
                autoSettlementEnabled: customSettlement.auto_settlement_enabled !== 'false',
                hasKey: !!config.consumerKey,
                hasSecret: !!config.consumerSecret,
                hasPasskey: !!config.passkey
            }
        });
    } catch (error) {
        console.error('Error fetching M-Pesa settings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch M-Pesa settings' });
    }
});

/**
 * @route   POST /api/mpesa/settings
 * @desc    Save/Update M-Pesa settlement account and credentials in database
 * @access  Admin
 */
router.post('/settings', async (req, res) => {
    try {
        const { query, generateUUID } = require('../config/database');
        const {
            shortcode,
            passkey,
            consumerKey,
            consumerSecret,
            environment,
            transactionType,
            callbackURL,
            settlementShortcode,
            settlementType,
            settlementAccountRef,
            autoSettlementEnabled
        } = req.body;

        const settingsToSave = [];
        if (shortcode !== undefined && shortcode !== null) settingsToSave.push({ key: 'mpesa_shortcode', val: shortcode, desc: 'Gateway Shortcode / Paybill' });
        if (passkey !== undefined && passkey !== null) settingsToSave.push({ key: 'mpesa_passkey', val: passkey, desc: 'M-Pesa Passkey' });
        if (consumerKey !== undefined && consumerKey !== null) settingsToSave.push({ key: 'mpesa_consumer_key', val: consumerKey, desc: 'M-Pesa Consumer Key' });
        if (consumerSecret !== undefined && consumerSecret !== null) settingsToSave.push({ key: 'mpesa_consumer_secret', val: consumerSecret, desc: 'M-Pesa Consumer Secret' });
        if (environment !== undefined && environment !== null) settingsToSave.push({ key: 'mpesa_environment', val: environment, desc: 'M-Pesa Environment (sandbox/production)' });
        if (transactionType !== undefined && transactionType !== null) settingsToSave.push({ key: 'mpesa_transaction_type', val: transactionType, desc: 'Gateway Transaction Type' });
        if (callbackURL !== undefined && callbackURL !== null) settingsToSave.push({ key: 'mpesa_callback_url', val: callbackURL, desc: 'M-Pesa Callback URL' });
        
        // Admin Settlement Destination Settings
        if (settlementShortcode !== undefined && settlementShortcode !== null) settingsToSave.push({ key: 'settlement_shortcode', val: settlementShortcode, desc: 'Admin Settlement Destination Shortcode / Till / Paybill' });
        if (settlementType !== undefined && settlementType !== null) settingsToSave.push({ key: 'settlement_type', val: settlementType, desc: 'Admin Settlement Destination Type' });
        if (settlementAccountRef !== undefined && settlementAccountRef !== null) settingsToSave.push({ key: 'settlement_account_ref', val: settlementAccountRef, desc: 'Admin Settlement Account Number / Ref' });
        if (autoSettlementEnabled !== undefined && autoSettlementEnabled !== null) settingsToSave.push({ key: 'auto_settlement_enabled', val: String(autoSettlementEnabled), desc: 'Auto B2B Settlement to Admin Account' });

        for (const item of settingsToSave) {
            if (item.val !== undefined && item.val !== null) {
                const existing = await query('SELECT id FROM system_settings WHERE setting_key = ?', [item.key]);
                if (existing && existing.length > 0) {
                    await query('UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?', [String(item.val), item.key]);
                } else {
                    const id = generateUUID ? generateUUID() : String(Date.now());
                    await query('INSERT INTO system_settings (id, setting_key, setting_value, data_type, description, is_editable, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())', [id, item.key, String(item.val), 'string', item.desc]);
                }
            }
        }

        res.json({
            success: true,
            message: 'M-Pesa settlement and API settings saved successfully!'
        });
    } catch (error) {
        console.error('Error saving M-Pesa settings:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to save settings' });
    }
});

module.exports = router;

