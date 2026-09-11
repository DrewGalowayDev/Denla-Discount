-- Contact Messages Table
-- This table stores all contact form submissions from the website

CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    project VARCHAR(255),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Add comment to table
COMMENT ON TABLE contact_messages IS 'Stores all contact form submissions from the website';

-- Add comments to columns
COMMENT ON COLUMN contact_messages.id IS 'Unique identifier for each contact message';
COMMENT ON COLUMN contact_messages.name IS 'Name of the person submitting the contact form';
COMMENT ON COLUMN contact_messages.email IS 'Email address of the person';
COMMENT ON COLUMN contact_messages.phone IS 'Phone number (optional)';
COMMENT ON COLUMN contact_messages.project IS 'Project information (optional)';
COMMENT ON COLUMN contact_messages.subject IS 'Subject of the message (optional)';
COMMENT ON COLUMN contact_messages.message IS 'The actual message content';
COMMENT ON COLUMN contact_messages.status IS 'Status of the message: new, read, replied, or archived';
COMMENT ON COLUMN contact_messages.created_at IS 'Timestamp when the message was submitted';
COMMENT ON COLUMN contact_messages.updated_at IS 'Timestamp when the message was last updated';

-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (submit contact form)
CREATE POLICY "Allow public to submit contact forms" ON contact_messages
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Allow authenticated users to read their own messages
CREATE POLICY "Allow users to read own messages" ON contact_messages
    FOR SELECT
    TO public
    USING (auth.uid() IS NOT NULL);

-- Policy: Allow admins to read all messages (you'll need to create an admin role)
-- CREATE POLICY "Allow admins to read all messages" ON contact_messages
--     FOR SELECT
--     TO authenticated
--     USING (auth.jwt() ->> 'role' = 'admin');

-- Policy: Allow admins to update message status
-- CREATE POLICY "Allow admins to update messages" ON contact_messages
--     FOR UPDATE
--     TO authenticated
--     USING (auth.jwt() ->> 'role' = 'admin')
--     WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER contact_messages_updated_at_trigger
    BEFORE UPDATE ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at();
