-- M-Pesa Transactions Table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mpesa_transactions (
    id BIGSERIAL PRIMARY KEY,
    merchant_request_id VARCHAR(100),
    checkout_request_id VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    account_reference VARCHAR(100),
    transaction_desc VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    result_code VARCHAR(10),
    result_desc VARCHAR(255),
    mpesa_receipt_number VARCHAR(50),
    transaction_date VARCHAR(20),
    callback_received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_mpesa_checkout_request ON mpesa_transactions(checkout_request_id);
CREATE INDEX idx_mpesa_phone ON mpesa_transactions(phone_number);
CREATE INDEX idx_mpesa_status ON mpesa_transactions(status);
CREATE INDEX idx_mpesa_created_at ON mpesa_transactions(created_at);
CREATE INDEX idx_mpesa_receipt ON mpesa_transactions(mpesa_receipt_number);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_mpesa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mpesa_updated_at_trigger
BEFORE UPDATE ON mpesa_transactions
FOR EACH ROW
EXECUTE FUNCTION update_mpesa_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow service role to do everything
CREATE POLICY "Service role can do everything" ON mpesa_transactions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow anon/authenticated to insert (for STK Push initiation)
CREATE POLICY "Allow insert for all" ON mpesa_transactions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow anon/authenticated to select their own transactions
CREATE POLICY "Users can view their own transactions" ON mpesa_transactions
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow anon to update (for callback updates)
CREATE POLICY "Allow callback updates" ON mpesa_transactions
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE mpesa_transactions IS 'Stores M-Pesa STK Push transaction records';
COMMENT ON COLUMN mpesa_transactions.merchant_request_id IS 'Unique ID from M-Pesa for merchant request';
COMMENT ON COLUMN mpesa_transactions.checkout_request_id IS 'Unique ID from M-Pesa for checkout request';
COMMENT ON COLUMN mpesa_transactions.phone_number IS 'Customer phone number in 254XXXXXXXXX format';
COMMENT ON COLUMN mpesa_transactions.amount IS 'Transaction amount in KSh';
COMMENT ON COLUMN mpesa_transactions.status IS 'Transaction status: pending, completed, or failed';
COMMENT ON COLUMN mpesa_transactions.mpesa_receipt_number IS 'M-Pesa receipt number (confirmation code)';
COMMENT ON COLUMN mpesa_transactions.callback_received_at IS 'Timestamp when callback was received from Safaricom';
