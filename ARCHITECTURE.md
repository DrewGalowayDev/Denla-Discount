# M-Pesa Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1. Fills checkout form
                                    │    Selects M-Pesa payment
                                    │    Enters phone: 254712345678
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (cheackout.html)                        │
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐          │
│  │ Form Validator │  │ Phone Formatter│  │ Payment Handler │          │
│  └───────┬────────┘  └───────┬────────┘  └────────┬────────┘          │
│          │                   │                     │                    │
│          └───────────────────┴─────────────────────┘                    │
│                              │                                           │
│                              │ 2. Validates & sends                     │
│                              │    POST /api/mpesa/stkpush               │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js/Python)                          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │  /api/mpesa/stkpush                                          │       │
│  │  - Validates phone & amount                                  │       │
│  │  - Generates password & timestamp                            │       │
│  │  - Calls Safaricom OAuth API                                 │       │
│  │  - Gets access token                                         │       │
│  │  - Saves transaction to database                             │       │
│  └─────────────────────┬───────────────────────────────────────┘       │
│                        │                                                 │
│                        │ 3. Sends STK Push request                      │
└────────────────────────┼─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   SAFARICOM DARAJA API                                   │
│                   (sandbox.safaricom.co.ke)                              │
│                                                                          │
│  OAuth API          STK Push API         Callback                       │
│  /oauth/v1/         /mpesa/stkpush/      (sends to your server)         │
│  generate           v1/processrequest                                    │
│                                                                          │
│  Returns:           Processes:           Sends:                         │
│  - Access Token     - Phone validation   - ResultCode                   │
│                     - Amount check       - MpesaReceipt                 │
│                     - Sends to phone     - TransactionDate              │
└────────────────────────┬────────────────────────┬────────────────────────┘
                         │                        │
                         │ 4. STK Push            │ 6. Payment callback
                         │    sent to phone       │    (async)
                         ▼                        ▼
┌─────────────────────────────┐    ┌──────────────────────────────────────┐
│   CUSTOMER'S PHONE          │    │  BACKEND /api/mpesa/callback         │
│                             │    │                                      │
│  ┌───────────────────────┐ │    │  - Receives payment result           │
│  │ M-PESA STK Push       │ │    │  - Updates database                  │
│  │                       │ │    │  - Sets status: completed/failed     │
│  │ Awesome Tech          │ │    │  - Returns ResultCode: 0             │
│  │ KSh 1,500             │ │    └──────────────────────────────────────┘
│  │                       │ │                        │
│  │ Enter PIN:           │ │                        │
│  │ ****                 │ │                        │
│  │                       │ │                        │
│  │ [Confirm] [Cancel]   │ │                        │
│  └───────────────────────┘ │                        │
│                             │                        │
│  5. User enters PIN         │                        │
│     Confirms payment        │                        │
└─────────────────────────────┘                        │
                                                       │
                 ┌─────────────────────────────────────┘
                 │
                 │ 7. Status updated in DB
                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE (MySQL/PostgreSQL)                      │
│                                                                          │
│  mpesa_transactions table:                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ checkout_request_id  | phone_number  | amount | status          │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ ws_CO_1234567890    | 254712345678  | 1500   | pending         │   │
│  │ ws_CO_1234567890    | 254712345678  | 1500   | completed ✅    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                 │
                 │ 8. Frontend polls status
                 │    GET /api/mpesa/status/{id}
                 │    Every 2 seconds
                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND /api/mpesa/status/:id                         │
│                                                                          │
│  - Queries database for transaction                                     │
│  - Returns current status                                               │
│  - If pending, checks Safaricom status query API                        │
│  - Returns: { status: 'completed', receipt: 'PHR123456' }               │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ 9. Status response
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Status Polling)                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  pollMpesaPayment()                                           │      │
│  │  - Calls status API every 2 seconds                           │      │
│  │  - Max 30 attempts (60 seconds)                               │      │
│  │  - If completed: Show success modal                           │      │
│  │  - If failed: Show error modal                                │      │
│  │  - If timeout: Show timeout message                           │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  10. Display result to user                                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SUCCESS MODAL                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │                          ✅                                 │        │
│  │                Payment Successful!                         │        │
│  │                                                             │        │
│  │  M-Pesa Receipt: PHR123456                                 │        │
│  │  Transaction ID: ws_CO_1234567890                          │        │
│  │                                                             │        │
│  │  Your order has been placed successfully!                  │        │
│  │                                                             │        │
│  │           [Continue Shopping]                              │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  11. Create order in database                                           │
│  12. Clear shopping cart                                                │
│  13. Send confirmation email (optional)                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence

### Request Flow (Frontend → Backend → Safaricom)
```
User Input
    │
    └─> Frontend Validation
            │
            └─> POST /api/mpesa/stkpush
                    │
                    ├─> Backend validates
                    ├─> Gets OAuth token
                    ├─> Saves to database (pending)
                    └─> Calls Safaricom STK Push API
                            │
                            └─> Safaricom sends STK to phone
```

### Response Flow (Safaricom → Backend → Frontend)
```
Safaricom STK Push Response
    │
    └─> Returns CheckoutRequestID immediately
            │
            └─> Backend saves CheckoutRequestID
                    │
                    └─> Frontend receives CheckoutRequestID
                            │
                            └─> Shows "Check your phone" modal

(Meanwhile, async...)

Customer confirms on phone
    │
    └─> Safaricom processes payment
            │
            └─> Safaricom calls /api/mpesa/callback
                    │
                    └─> Backend updates database
                            │
                            └─> Sets status = 'completed'

(Frontend polling...)

Frontend polls GET /api/mpesa/status/:id
    │
    └─> Backend queries database
            │
            └─> Returns status: 'completed'
                    │
                    └─> Frontend shows success modal
                            │
                            └─> Creates order
                            └─> Clears cart
```

---

## Component Breakdown

### Frontend Components

```
cheackout.html
│
├─ Form Section
│  ├─ Billing Details (name, email, phone, address)
│  ├─ Payment Method Selection (M-Pesa, COD, Bank)
│  └─ M-Pesa Phone Input (auto-formatting)
│
├─ JavaScript Functions
│  ├─ selectPaymentMethod()         - Handles payment method switching
│  ├─ initiateMpesaPayment()        - Sends STK Push request
│  ├─ pollMpesaPayment()            - Polls for payment status
│  ├─ checkMpesaPaymentStatus()     - Queries status API
│  ├─ showMpesaStatus()             - Displays modal
│  └─ Form Submit Handler           - Main checkout logic
│
└─ UI Components
   ├─ Payment Method Cards
   ├─ M-Pesa Phone Input Field
   ├─ Payment Status Modal
   └─ Success/Failure Messages
```

### Backend Components

```
Backend API
│
├─ M-Pesa Service
│  ├─ getAccessToken()              - OAuth authentication
│  ├─ generatePassword()            - Creates password & timestamp
│  ├─ stkPush()                     - Initiates STK Push
│  └─ queryTransaction()            - Checks payment status
│
├─ API Routes
│  ├─ POST /api/mpesa/stkpush       - STK Push endpoint
│  ├─ GET  /api/mpesa/status/:id    - Status query endpoint
│  └─ POST /api/mpesa/callback      - Safaricom callback
│
└─ Database Operations
   ├─ Create transaction (pending)
   ├─ Update transaction (callback)
   └─ Query transaction (status check)
```

---

## Technology Stack

```
┌──────────────────────────────────────────────────┐
│ Frontend Layer                                    │
├──────────────────────────────────────────────────┤
│ - HTML5                                           │
│ - CSS3 (Bootstrap 5)                              │
│ - JavaScript (ES6+)                               │
│ - Fetch API (AJAX requests)                       │
│ - LocalStorage (cart persistence)                 │
└──────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│ Backend Layer (Choose one)                        │
├──────────────────────────────────────────────────┤
│ Option 1: Node.js                                 │
│ - Express.js (server framework)                   │
│ - Axios (HTTP client)                             │
│ - Moment.js (date formatting)                     │
│                                                   │
│ Option 2: Python                                  │
│ - Flask (server framework)                        │
│ - Requests (HTTP client)                          │
│ - python-dotenv (config)                          │
└──────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│ Database Layer (Choose one)                       │
├──────────────────────────────────────────────────┤
│ - MySQL                                           │
│ - PostgreSQL                                      │
│ - MongoDB                                         │
└──────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│ External APIs                                     │
├──────────────────────────────────────────────────┤
│ - Safaricom Daraja API                            │
│   - OAuth API (authentication)                    │
│   - STK Push API (payment initiation)             │
│   - Callback (payment confirmation)               │
└──────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│ Error can occur at multiple points:                     │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Frontend   │  │   Backend    │  │   Safaricom  │
│   Errors     │  │   Errors     │  │   Errors     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ - Invalid   │   │ - OAuth     │   │ - Insuffi-  │
│   phone     │   │   failed    │   │   cient     │
│ - Missing   │   │ - Database  │   │   balance   │
│   amount    │   │   error     │   │ - Wrong PIN │
│ - Form not  │   │ - Network   │   │ - Timeout   │
│   valid     │   │   timeout   │   │ - Cancelled │
└─────┬───────┘   └─────┬───────┘   └─────┬───────┘
      │                 │                 │
      └────────┬────────┴────────┬────────┘
               │                 │
               ▼                 ▼
      ┌────────────────┐  ┌──────────────┐
      │ Display Error  │  │ Log Error    │
      │ to User        │  │ to Console   │
      └────────────────┘  └──────────────┘
               │
               ▼
      ┌────────────────┐
      │ Allow Retry    │
      │ Keep Cart      │
      └────────────────┘
```

---

## State Machine (Payment Status)

```
┌─────────┐
│ INITIAL │
│ (null)  │
└────┬────┘
     │
     │ User submits form
     ▼
┌─────────┐
│ PENDING │ ◄─────┐
│         │       │
└────┬────┘       │
     │            │
     │            │ Status check
     │            │ (not completed)
     ▼            │
┌─────────────┐   │
│ PROCESSING  ├───┘
│ (polling)   │
└──────┬──────┘
       │
       ├─────────────┬─────────────┐
       │             │             │
       ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌──────────┐
│ COMPLETED │  │  FAILED   │  │ TIMEOUT  │
│ (success) │  │  (error)  │  │ (waited  │
│           │  │           │  │  60 sec) │
└─────┬─────┘  └─────┬─────┘  └────┬─────┘
      │              │              │
      │              │              │
      ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Create   │   │ Show     │   │ Contact  │
│ Order    │   │ Error    │   │ Support  │
│ Clear    │   │ Allow    │   │ Check    │
│ Cart     │   │ Retry    │   │ Status   │
└──────────┘   └──────────┘   └──────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Frontend    │  │   Backend    │  │  External    │
│  Security    │  │   Security   │  │  Security    │
└──────────────┘  └──────────────┘  └──────────────┘

Frontend Security:
├─ Input Validation
│  ├─ Phone number format (regex)
│  ├─ Amount validation (>0)
│  └─ Required field checks
├─ XSS Prevention
│  └─ Sanitize user inputs
└─ HTTPS Only
   └─ Secure data transmission

Backend Security:
├─ Authentication
│  ├─ OAuth 2.0 (Safaricom)
│  └─ API key validation
├─ Data Validation
│  ├─ Server-side validation
│  ├─ Type checking
│  └─ Range validation
├─ Encryption
│  ├─ HTTPS/TLS
│  ├─ Password hashing
│  └─ Credential storage (.env)
├─ Rate Limiting
│  ├─ Prevent spam
│  └─ DDoS protection
└─ Logging & Monitoring
   ├─ Transaction logs
   ├─ Error tracking
   └─ Audit trail

External Security:
├─ Safaricom Daraja
│  ├─ SSL/TLS encryption
│  ├─ OAuth authentication
│  └─ Callback verification
├─ Database
│  ├─ Connection encryption
│  ├─ Access control
│  └─ Regular backups
└─ Infrastructure
   ├─ Firewall rules
   ├─ IP whitelisting
   └─ DDoS protection
```

---

## Deployment Architecture

```
                    ┌──────────────┐
                    │   Internet   │
                    └──────┬───────┘
                           │
                ┌──────────▼─────────┐
                │   Load Balancer    │
                │   (HTTPS/SSL)      │
                └──────────┬─────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
    ┌──────────────┐            ┌──────────────┐
    │  Web Server  │            │  Web Server  │
    │  (Nginx)     │            │  (Nginx)     │
    └──────┬───────┘            └──────┬───────┘
           │                           │
           └──────────┬────────────────┘
                      │
              ┌───────▼────────┐
              │  Application   │
              │  Server        │
              │  (Node.js/     │
              │   Python)      │
              └───────┬────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Database │  │  Cache   │  │  Logs    │
│ (MySQL)  │  │  (Redis) │  │ (ELK)    │
└──────────┘  └──────────┘  └──────────┘
        │
        └─────────────────────────────┐
                                      │
                              ┌───────▼────────┐
                              │   Safaricom    │
                              │   Daraja API   │
                              └────────────────┘
```

This architecture diagram shows the complete M-Pesa integration flow from user interaction to database storage and status polling. Each component has been implemented in your system!
