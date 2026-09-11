# Contact Form Database Setup

This guide explains how to set up the contact messages database table for the Awesome Technologies website.

## Database Table: contact_messages

The contact form submissions are stored in the `contact_messages` table in your Supabase database.

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to [https://supabase.com](https://supabase.com)
   - Login to your account
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the SQL Script**
   - Copy the entire contents of `backend/database/contact_messages.sql`
   - Paste it into the SQL editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Table Creation**
   - Go to "Table Editor" in the left sidebar
   - You should see the `contact_messages` table listed
   - Click on it to view the structure

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the backend directory
cd backend

# Run the SQL file
supabase db push

# Or execute the SQL file directly
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f database/contact_messages.sql
```

## Table Structure

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key, auto-increment |
| name | VARCHAR(255) | Customer's full name (required) |
| email | VARCHAR(255) | Customer's email address (required) |
| phone | VARCHAR(50) | Customer's phone number (optional) |
| project | VARCHAR(255) | Project information (optional) |
| subject | VARCHAR(500) | Message subject (optional) |
| message | TEXT | Message content (required) |
| status | VARCHAR(20) | Message status: new, read, replied, archived |
| created_at | TIMESTAMP | When the message was submitted |
| updated_at | TIMESTAMP | When the message was last updated |

## Features

✅ **Auto-timestamps**: `created_at` and `updated_at` are automatically managed  
✅ **Row Level Security (RLS)**: Enabled for data protection  
✅ **Indexes**: Optimized for fast queries on email, status, and created_at  
✅ **Status Validation**: Only allows valid status values  

## API Endpoints

### Submit Contact Form (Public)
```http
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+254704546916",
  "project": "Website Development",
  "subject": "Inquiry about services",
  "message": "I would like to know more about your services..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for contacting us! We will get back to you soon.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    ...
  }
}
```

### Get All Messages (Admin Only)
```http
GET /api/contact?status=new
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

### Update Message Status (Admin Only)
```http
PATCH /api/contact/:id
Content-Type: application/json

{
  "status": "read"
}
```

## Testing the Contact Form

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Server should run on http://localhost:5000

2. **Open Contact Page**
   - Navigate to `contact.html` in your browser
   - Fill out the contact form
   - Click "Send Message"

3. **Verify Submission**
   - Check Supabase Dashboard → Table Editor → contact_messages
   - You should see your test message with status "new"

## Status Values

- **new**: Message just submitted (default)
- **read**: Message has been viewed by admin
- **replied**: Admin has responded to the message
- **archived**: Message archived (completed/closed)

## Security Features

✅ **Input Validation**: All inputs are validated before saving  
✅ **Email Validation**: Ensures valid email format  
✅ **SQL Injection Protection**: Using parameterized queries  
✅ **Rate Limiting**: Prevents spam submissions  
✅ **XSS Protection**: Inputs are sanitized  

## Troubleshooting

### Error: "Failed to submit contact form"
- Check if backend server is running on port 5000
- Verify Supabase connection in `.env` file
- Check browser console for detailed error messages

### Error: "relation 'contact_messages' does not exist"
- Run the SQL script in Supabase Dashboard
- Verify table was created successfully

### Form not submitting
- Check browser console for JavaScript errors
- Verify API_BASE URL in contact.html matches your backend
- Ensure CORS is properly configured in backend

## Admin Panel (Future Enhancement)

Consider creating an admin panel to:
- View all contact messages
- Filter by status
- Search by email/name
- Mark messages as read/replied
- Export messages to CSV

## Email Notifications (Optional)

To send email notifications when contact forms are submitted, you can integrate:
- SendGrid
- AWS SES
- Nodemailer with Gmail

## Support

For issues or questions:
- Email: info@awesometech.co.ke
- Phone: +254 704 546 916
