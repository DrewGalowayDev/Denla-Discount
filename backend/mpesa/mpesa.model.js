const { query, queryOne, generateUUID } = require('../config/database');

class MpesaModel {
    /**
     * Create a new M-Pesa transaction record
     */
    async createTransaction(data) {
        try {
            const id = generateUUID();
            const sql = `
                INSERT INTO mpesa_transactions (
                    id, merchant_request_id, checkout_request_id, phone_number,
                    amount, account_reference, transaction_desc, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
            `;
            await query(sql, [
                id,
                data.merchantRequestId || null,
                data.checkoutRequestId,
                data.phoneNumber,
                data.amount,
                data.accountReference || null,
                data.transactionDesc || null
            ]);

            return await this.getByCheckoutRequestId(data.checkoutRequestId);
        } catch (error) {
            console.error('Error creating M-Pesa transaction:', error);
            throw error;
        }
    }

    /**
     * Get transaction by checkout request ID
     */
    async getByCheckoutRequestId(checkoutRequestId) {
        try {
            const sql = `SELECT * FROM mpesa_transactions WHERE checkout_request_id = ? LIMIT 1`;
            return await queryOne(sql, [checkoutRequestId]);
        } catch (error) {
            console.error('Error fetching M-Pesa transaction:', error);
            throw error;
        }
    }

    /**
     * Update transaction status
     */
    async updateTransaction(checkoutRequestId, updateData) {
        try {
            const fields = [];
            const values = [];

            if (updateData.status !== undefined) {
                fields.push('status = ?');
                values.push(updateData.status);
            }
            if (updateData.result_code !== undefined) {
                fields.push('result_code = ?');
                values.push(updateData.result_code);
            }
            if (updateData.result_desc !== undefined) {
                fields.push('result_desc = ?');
                values.push(updateData.result_desc);
            }
            if (updateData.mpesa_receipt_number !== undefined) {
                fields.push('mpesa_receipt_number = ?');
                values.push(updateData.mpesa_receipt_number);
            }
            if (updateData.transaction_date !== undefined) {
                fields.push('transaction_date = ?');
                values.push(updateData.transaction_date);
            }

            if (fields.length === 0) {
                return await this.getByCheckoutRequestId(checkoutRequestId);
            }

            values.push(checkoutRequestId);
            const sql = `UPDATE mpesa_transactions SET ${fields.join(', ')} WHERE checkout_request_id = ?`;
            await query(sql, values);

            return await this.getByCheckoutRequestId(checkoutRequestId);
        } catch (error) {
            console.error('Error updating M-Pesa transaction:', error);
            throw error;
        }
    }

    /**
     * Get transaction by merchant request ID
     */
    async getByMerchantRequestId(merchantRequestId) {
        try {
            const sql = `SELECT * FROM mpesa_transactions WHERE merchant_request_id = ? LIMIT 1`;
            return await queryOne(sql, [merchantRequestId]);
        } catch (error) {
            console.error('Error fetching M-Pesa transaction:', error);
            throw error;
        }
    }

    /**
     * Get all transactions for a phone number
     */
    async getByPhoneNumber(phoneNumber, limit = 10) {
        try {
            const sql = `
                SELECT * FROM mpesa_transactions 
                WHERE phone_number = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            return await query(sql, [phoneNumber, parseInt(limit, 10)]);
        } catch (error) {
            console.error('Error fetching transactions by phone:', error);
            throw error;
        }
    }

    /**
     * Get all pending transactions
     */
    async getPendingTransactions() {
        try {
            const sql = `
                SELECT * FROM mpesa_transactions 
                WHERE status = 'pending' 
                ORDER BY created_at DESC
            `;
            return await query(sql);
        } catch (error) {
            console.error('Error fetching pending transactions:', error);
            throw error;
        }
    }

    /**
     * Get transaction statistics
     */
    async getStats(startDate = null, endDate = null) {
        try {
            let sql = `SELECT status, amount, created_at FROM mpesa_transactions WHERE 1=1`;
            const params = [];

            if (startDate) {
                sql += ` AND created_at >= ?`;
                params.push(startDate);
            }
            if (endDate) {
                sql += ` AND created_at <= ?`;
                params.push(endDate);
            }

            const rows = await query(sql, params);

            const stats = {
                total: rows.length,
                completed: rows.filter(t => t.status === 'completed').length,
                failed: rows.filter(t => t.status === 'failed').length,
                pending: rows.filter(t => t.status === 'pending').length,
                totalAmount: rows
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
            };

            return stats;
        } catch (error) {
            console.error('Error getting M-Pesa stats:', error);
            throw error;
        }
    }
}

module.exports = new MpesaModel();
