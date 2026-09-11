// M-Pesa API — MySQL version
const { query, queryOne, generateUUID } = require('../backend/config/database');
const { setCorsHeaders, handleOptions } = require('./_utils/cors');
const axios = require('axios');

module.exports = async (req, res) => {
  setCorsHeaders(res, req);
  if (handleOptions(req, res)) return;

  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const path = pathname.split('/mpesa/')[1] || '';

    if (path === 'stkpush') return handleStkPush(req, res);
    if (path === 'callback') return handleCallback(req, res);
    if (path.startsWith('status')) return handleStatus(req, res);
    return res.status(404).json({ error: 'M-Pesa endpoint not found' });
  } catch (error) {
    console.error('M-Pesa API error:', error);
    return res.status(500).json({ success: false, error: 'Server error', message: error.message });
  }
};

async function handleStkPush(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { phoneNumber, amount, orderId } = req.body;
    if (!phoneNumber || !amount) {
      return res.status(400).json({ success: false, message: 'Phone number and amount are required' });
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const accessToken = tokenResponse.data.access_token;

    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    else if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').substring(0, 14);
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const stkPushResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: `${process.env.VERCEL_URL || 'https://awesometechnologies.tech'}/api/mpesa/callback`,
        AccountReference: orderId || 'ORDER',
        TransactionDesc: 'Payment for order'
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Save transaction to MySQL
    const id = generateUUID();
    try {
      await query(
        `INSERT INTO mpesa_transactions (id, checkout_request_id, merchant_request_id, phone_number, amount, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [id, stkPushResponse.data.CheckoutRequestID, stkPushResponse.data.MerchantRequestID, formattedPhone, amount]
      );
    } catch (dbErr) {
      console.warn('Could not save mpesa transaction to DB:', dbErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'STK Push sent successfully',
      checkoutRequestId: stkPushResponse.data.CheckoutRequestID,
      merchantRequestId: stkPushResponse.data.MerchantRequestID
    });
  } catch (error) {
    console.error('M-Pesa STK Push error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment initiation failed', error: error.response?.data || error.message });
  }
}

async function handleCallback(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const callbackData = req.body;
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

    const { Body: { stkCallback } } = callbackData;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;
    const status = resultCode === 0 ? 'completed' : 'failed';

    let mpesaReceiptNumber = null, transactionDate = null, phoneNumber = null;
    if (resultCode === 0 && stkCallback.CallbackMetadata) {
      const items = stkCallback.CallbackMetadata.Item;
      mpesaReceiptNumber = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value || null;
      transactionDate = items.find(i => i.Name === 'TransactionDate')?.Value || null;
      phoneNumber = items.find(i => i.Name === 'PhoneNumber')?.Value?.toString() || null;
    }

    try {
      await query(
        `UPDATE mpesa_transactions SET status = ?, result_code = ?, result_desc = ?,
         mpesa_receipt_number = ?, transaction_date = ?, phone_number = COALESCE(?, phone_number)
         WHERE checkout_request_id = ?`,
        [status, resultCode.toString(), resultDesc, mpesaReceiptNumber, transactionDate, phoneNumber, checkoutRequestId]
      );
    } catch (dbErr) {
      console.warn('Could not update mpesa transaction:', dbErr.message);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
}

async function handleStatus(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const checkoutRequestId = pathname.split('/status/')[1];

    if (!checkoutRequestId) {
      return res.status(400).json({ success: false, message: 'Checkout Request ID is required' });
    }

    const transaction = await queryOne(
      'SELECT * FROM mpesa_transactions WHERE checkout_request_id = ? LIMIT 1',
      [checkoutRequestId]
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ success: false, message: 'Status check failed' });
  }
}
