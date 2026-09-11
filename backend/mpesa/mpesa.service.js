const axios = require('axios');
const moment = require('moment');

class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.shortcode = process.env.MPESA_SHORTCODE;
        this.passkey = process.env.MPESA_PASSKEY;
        this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
        
        this.baseURL = this.environment === 'production' 
            ? process.env.MPESA_BASE_URL_PRODUCTION
            : process.env.MPESA_BASE_URL_SANDBOX;

        this.callbackURL = process.env.MPESA_CALLBACK_URL;
        this.timeoutURL = process.env.MPESA_TIMEOUT_URL;
    }

    /**
     * Get OAuth Access Token from M-Pesa
     */
    async getAccessToken() {
        try {
            const auth = Buffer.from(
                `${this.consumerKey}:${this.consumerSecret}`
            ).toString('base64');

            const response = await axios.get(
                `${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`,
                {
                    headers: {
                        Authorization: `Basic ${auth}`
                    }
                }
            );

            return response.data.access_token;
        } catch (error) {
            console.error('M-Pesa Access Token Error:', error.response?.data || error.message);
            throw new Error('Failed to get M-Pesa access token');
        }
    }

    /**
     * Generate Password and Timestamp for STK Push
     */
    generatePassword() {
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const password = Buffer.from(
            `${this.shortcode}${this.passkey}${timestamp}`
        ).toString('base64');
        
        return { password, timestamp };
    }

    /**
     * Format phone number to 254XXXXXXXXX format
     */
    formatPhoneNumber(phoneNumber) {
        let formatted = phoneNumber.replace(/\s/g, '').replace(/\+/g, '');
        
        if (formatted.startsWith('0')) {
            formatted = '254' + formatted.substring(1);
        } else if (formatted.startsWith('7') && !formatted.startsWith('254')) {
            formatted = '254' + formatted;
        }
        
        return formatted;
    }

    /**
     * Initiate STK Push Payment
     */
    async stkPush(phoneNumber, amount, accountReference, transactionDesc) {
        try {
            const accessToken = await this.getAccessToken();
            const { password, timestamp } = this.generatePassword();
            const formattedPhone = this.formatPhoneNumber(phoneNumber);

            // Validate phone number
            if (!/^254[0-9]{9}$/.test(formattedPhone)) {
                throw new Error('Invalid phone number format. Use 254XXXXXXXXX');
            }

            // Ensure amount is integer
            const amountInt = Math.ceil(parseFloat(amount));

            const payload = {
                BusinessShortCode: this.shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline', // or CustomerBuyGoodsOnline for Till
                Amount: amountInt,
                PartyA: formattedPhone,
                PartyB: this.shortcode,
                PhoneNumber: formattedPhone,
                CallBackURL: this.callbackURL,
                AccountReference: accountReference,
                TransactionDesc: transactionDesc || 'Payment'
            };

            console.log('📱 Initiating M-Pesa STK Push:', {
                phone: formattedPhone,
                amount: amountInt,
                reference: accountReference
            });

            const response = await axios.post(
                `${this.baseURL}/mpesa/stkpush/v1/processrequest`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ M-Pesa STK Push Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ M-Pesa STK Push Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.errorMessage || error.message || 'STK Push failed');
        }
    }

    /**
     * Query Transaction Status
     */
    async queryTransaction(checkoutRequestId) {
        try {
            const accessToken = await this.getAccessToken();
            const { password, timestamp } = this.generatePassword();

            const payload = {
                BusinessShortCode: this.shortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId
            };

            console.log('🔍 Querying M-Pesa transaction:', checkoutRequestId);

            const response = await axios.post(
                `${this.baseURL}/mpesa/stkpushquery/v1/query`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('❌ M-Pesa Query Error:', error.response?.data || error.message);
            throw new Error('Failed to query transaction');
        }
    }

    /**
     * Validate callback data
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

            // Extract metadata
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
}

module.exports = new MpesaService();
