const axios = require('axios');
const moment = require('moment');
const { query, queryOne } = require('../config/database');

class MpesaService {
    /**
     * Dynamically resolve M-Pesa configuration from database system_settings table or process.env
     */
    async getConfig() {
        let dbSettings = {};
        try {
            const rows = await query(`SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'mpesa_%'`);
            if (rows && Array.isArray(rows)) {
                rows.forEach(r => {
                    dbSettings[r.setting_key] = r.setting_value;
                });
            }
        } catch (e) {
            // If database error or table not yet populated, fallback silently
        }

        const consumerKey = dbSettings.mpesa_consumer_key || process.env.MPESA_CONSUMER_KEY || '';
        const consumerSecret = dbSettings.mpesa_consumer_secret || process.env.MPESA_CONSUMER_SECRET || '';
        const shortcode = dbSettings.mpesa_shortcode || process.env.MPESA_SHORTCODE || '';
        const passkey = dbSettings.mpesa_passkey || process.env.MPESA_PASSKEY || '';
        const environment = (dbSettings.mpesa_environment || process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT || 'production').toLowerCase();
        const transactionType = dbSettings.mpesa_transaction_type || process.env.MPESA_STK_TRANSACTION_TYPE || process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline';
        
        const baseURL = environment === 'production' 
            ? (process.env.MPESA_BASE_URL_PRODUCTION || 'https://api.safaricom.co.ke')
            : (process.env.MPESA_BASE_URL_SANDBOX || 'https://sandbox.safaricom.co.ke');

        const callbackURL = dbSettings.mpesa_callback_url || process.env.MPESA_CALLBACK_URL || 'https://denladiscount.work.gd/api/mpesa/stk/callback';

        return {
            consumerKey,
            consumerSecret,
            shortcode,
            passkey,
            environment,
            transactionType,
            baseURL,
            callbackURL
        };
    }

    /**
     * Get OAuth Access Token from M-Pesa
     */
    async getAccessToken() {
        const config = await this.getConfig();

        if (!config.consumerKey || !config.consumerSecret) {
            throw new Error('M-Pesa Consumer Key and Consumer Secret are not configured.');
        }

        try {
            const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

            const response = await axios.get(
                `${config.baseURL}/oauth/v1/generate?grant_type=client_credentials`,
                {
                    headers: {
                        Authorization: `Basic ${auth}`
                    },
                    timeout: 15000
                }
            );

            return response.data.access_token;
        } catch (error) {
            console.error('❌ M-Pesa Access Token Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.errorMessage || 'Failed to get M-Pesa access token from Safaricom');
        }
    }

    /**
     * Generate Password and Timestamp for STK Push
     */
    generatePassword(shortcode, passkey) {
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
        return { password, timestamp };
    }

    /**
     * Format phone number to 254XXXXXXXXX format
     * Supports standard 07XXXXXXXX, 01XXXXXXXX, +254XXXXXXXXX, 254XXXXXXXXX
     */
    formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return '';
        let formatted = String(phoneNumber).replace(/\s+/g, '').replace(/[-+]/g, '');
        
        if (formatted.startsWith('0')) {
            formatted = '254' + formatted.substring(1);
        } else if ((formatted.startsWith('7') || formatted.startsWith('1')) && formatted.length === 9) {
            formatted = '254' + formatted;
        }
        
        return formatted;
    }

    /**
     * Initiate STK Push Payment
     */
    async stkPush(phoneNumber, amount, accountReference, transactionDesc) {
        const config = await this.getConfig();

        if (!config.shortcode || !config.passkey) {
            throw new Error('M-Pesa Shortcode (Paybill/Till) and Passkey are not configured.');
        }

        try {
            const accessToken = await this.getAccessToken();
            const { password, timestamp } = this.generatePassword(config.shortcode, config.passkey);
            const formattedPhone = this.formatPhoneNumber(phoneNumber);

            // Validate phone number format (2547XXXXXXXX or 2541XXXXXXXX)
            if (!/^254[17][0-9]{8}$/.test(formattedPhone)) {
                throw new Error('Invalid Safaricom phone number. Must be 07XXXXXXXX or 01XXXXXXXX format.');
            }

            // Ensure amount is an integer >= 1
            const amountInt = Math.max(1, Math.round(parseFloat(amount)));

            const safeAccountRef = (accountReference || 'DD').toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 12) || 'DENLA';
            const safeTransDesc = (transactionDesc || 'Order').toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 12) || 'Order';

            const payload = {
                BusinessShortCode: config.shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: config.transactionType, // CustomerPayBillOnline or CustomerBuyGoodsOnline
                Amount: amountInt,
                PartyA: formattedPhone,
                PartyB: config.shortcode,
                PhoneNumber: formattedPhone,
                CallBackURL: config.callbackURL,
                AccountReference: safeAccountRef,
                TransactionDesc: safeTransDesc
            };

            console.log('📱 Initiating Safaricom M-Pesa STK Push:', {
                phone: formattedPhone,
                amount: amountInt,
                shortcode: config.shortcode,
                accountReference: payload.AccountReference,
                environment: config.environment
            });

            const response = await axios.post(
                `${config.baseURL}/mpesa/stkpush/v1/processrequest`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 20000
                }
            );

            console.log('✅ M-Pesa STK Push Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ M-Pesa STK Push Error:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.errorMessage || error.response?.data?.CustomerMessage || error.message || 'STK Push failed';
            throw new Error(errorMsg);
        }
    }

    /**
     * Query Transaction Status directly with Safaricom STK Query
     */
    async queryTransaction(checkoutRequestId) {
        const config = await this.getConfig();

        try {
            const accessToken = await this.getAccessToken();
            const { password, timestamp } = this.generatePassword(config.shortcode, config.passkey);

            const payload = {
                BusinessShortCode: config.shortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId
            };

            console.log('🔍 Querying M-Pesa STK status from Safaricom:', checkoutRequestId);

            const response = await axios.post(
                `${config.baseURL}/mpesa/stkpushquery/v1/query`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            return response.data;
        } catch (error) {
            console.error('❌ M-Pesa Query Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.errorMessage || error.message || 'Failed to query transaction');
        }
    }

    /**
     * Validate callback data sent by Safaricom
     */
    validateCallback(callbackData) {
        try {
            const { Body } = callbackData;
            if (!Body || !Body.stkCallback) {
                throw new Error('Invalid callback structure');
            }

            const { stkCallback } = Body;
            const {
                MerchantRequestID,
                CheckoutRequestID,
                ResultCode,
                ResultDesc
            } = stkCallback;

            let metadata = {
                mpesaReceiptNumber: null,
                transactionDate: null,
                phoneNumber: null,
                amount: null
            };

            if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
                stkCallback.CallbackMetadata.Item.forEach(item => {
                    switch (item.Name) {
                        case 'MpesaReceiptNumber':
                            metadata.mpesaReceiptNumber = item.Value;
                            break;
                        case 'TransactionDate':
                            metadata.transactionDate = item.Value;
                            break;
                        case 'PhoneNumber':
                            metadata.phoneNumber = item.Value;
                            break;
                        case 'Amount':
                            metadata.amount = item.Value;
                            break;
                    }
                });
            }

            return {
                merchantRequestId: MerchantRequestID,
                checkoutRequestId: CheckoutRequestID,
                resultCode: ResultCode,
                resultDesc: ResultDesc,
                ...metadata
            };
        } catch (error) {
            console.error('❌ Callback Validation Error:', error.message);
            throw error;
        }
    }

    /**
     * Initiate M-Pesa B2B Transfer (Business to Business / Till / Paybill)
     */
    async b2bTransfer({ amount, destinationShortcode, destinationType = 'CustomerPayBillOnline', accountReference = 'Settlement', remarks = 'Store Settlement' }) {
        const config = await this.getConfig();
        const accessToken = await this.getAccessToken();

        const initiatorName = process.env.MPESA_INITIATOR_NAME || 'initiator';
        const securityCredential = process.env.MPESA_SECURITY_CREDENTIAL || '';

        // Determine CommandID based on destination type
        const isTill = destinationType === 'CustomerBuyGoodsOnline' || destinationType === 'buygoods';
        const commandID = isTill ? 'BusinessBuyGoods' : 'BusinessPayBill';
        const receiverIdentifierType = isTill ? '2' : '4'; // 2 = Till, 4 = Shortcode/Paybill

        const timeoutUrl = `${config.callbackURL.replace(/\/stk\/callback|\/callback/, '')}/b2b/timeout`;
        const resultUrl = `${config.callbackURL.replace(/\/stk\/callback|\/callback/, '')}/b2b/result`;

        const amountInt = Math.max(1, Math.round(parseFloat(amount)));

        const payload = {
            Initiator: initiatorName,
            SecurityCredential: securityCredential,
            CommandID: commandID,
            SenderIdentifierType: '4', // Shortcode
            RecieverIdentifierType: receiverIdentifierType,
            Amount: amountInt,
            PartyA: config.shortcode,
            PartyB: destinationShortcode,
            AccountReference: (accountReference || 'Settlement').substring(0, 12),
            Remarks: (remarks || 'Settlement').substring(0, 30),
            QueueTimeOutURL: timeoutUrl,
            ResultURL: resultUrl
        };

        console.log('🔄 Initiating M-Pesa B2B Settlement:', {
            from: config.shortcode,
            to: destinationShortcode,
            type: commandID,
            amount: amountInt
        });

        try {
            const response = await axios.post(
                `${config.baseURL}/mpesa/b2b/v1/paymentrequest`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 20000
                }
            );

            console.log('✅ M-Pesa B2B Settlement Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ M-Pesa B2B Settlement Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.errorMessage || error.message || 'B2B Settlement Transfer Failed');
        }
    }

    /**
     * Automatic Settlement to Admin configured account upon successful customer payment
     */
    async settleToAdmin({ amount, receiptNumber, orderRef }) {
        try {
            const rows = await query(`SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('settlement_shortcode', 'settlement_type', 'settlement_account_ref', 'auto_settlement_enabled')`);
            const settings = {};
            if (rows && Array.isArray(rows)) {
                rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
            }

            const destinationShortcode = settings.settlement_shortcode;
            const destinationType = settings.settlement_type || 'CustomerPayBillOnline';
            const accountReference = settings.settlement_account_ref || orderRef || 'Settlement';
            const isAutoEnabled = settings.auto_settlement_enabled !== 'false';

            if (!isAutoEnabled || !destinationShortcode) {
                return null;
            }

            const config = await this.getConfig();
            if (destinationShortcode === config.shortcode) {
                return null;
            }

            return await this.b2bTransfer({
                amount,
                destinationShortcode,
                destinationType,
                accountReference,
                remarks: `Settlement for ${receiptNumber || orderRef}`
            });
        } catch (err) {
            console.warn('⚠️ Auto settlement notice:', err.message);
            return null;
        }
    }
}

module.exports = new MpesaService();
