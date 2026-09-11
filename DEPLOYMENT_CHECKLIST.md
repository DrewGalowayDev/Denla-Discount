# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Project Structure ✓
- [x] Created `/api` directory with serverless functions
- [x] Moved frontend files to `/public` directory
- [x] Created utility files in `/api/_utils`
- [x] Updated `package.json` with correct dependencies
- [x] Created `vercel.json` configuration

### 2. API Endpoints Created ✓
- [x] `/api/auth/login.js` - User login
- [x] `/api/auth/register.js` - User registration
- [x] `/api/auth/verify.js` - Token verification
- [x] `/api/products/index.js` - Get all products / Create product
- [x] `/api/products/[id].js` - Get/Update/Delete single product
- [x] `/api/categories/index.js` - Category management
- [x] `/api/mpesa/stkpush.js` - Initiate M-Pesa payment
- [x] `/api/mpesa/callback.js` - M-Pesa callback handler
- [x] `/api/mpesa/status.js` - Check payment status
- [x] `/api/orders/index.js` - Order management
- [x] `/api/contact/index.js` - Contact form submission
- [x] `/api/users/me.js` - User profile

### 3. Frontend Updates ✓
- [x] Updated API endpoints to use environment-aware URLs
- [x] Updated `admin-auth.js`
- [x] Updated `cart-manager.js`
- [x] Updated `auth-helper.js`
- [x] Updated `login-redirect.js`
- [x] Updated `admin-contact-messages.js`
- [x] Updated `user-activity-tracker.js`
- [x] Updated `load-products.js`
- [x] Updated `admin-activity-monitor.js`

### 4. Configuration Files ✓
- [x] Created `.gitignore`
- [x] Created `.env.example`
- [x] Updated `package.json`
- [x] Configured `vercel.json`

---

## 📋 Deployment Steps

### Step 1: Install Dependencies
```bash
cd c:\Users\user\Downloads\Electro\Electro
npm install
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Configured for Vercel deployment"
git push origin main
```

### Step 3: Deploy to Vercel

**Via Vercel Dashboard:**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework: **Other**
4. Root Directory: `./`
5. Click **Deploy**

**Via Vercel CLI:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Step 4: Configure Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables (copy from your `.env` file):

#### Required Variables:
```
SUPABASE_URL=https://yfkhkyrdioaknxzikwtg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your_strong_random_secret_key_here
JWT_EXPIRE=7d
MPESA_CONSUMER_KEY=T8432nxCur0TkDqT8vMXANOBE5PR6JMWBuzNOmK0ZS39Hci8
MPESA_CONSUMER_SECRET=P5ecGaRA0EgjbOG5dzdGe60azJg8PsvUW5uHY32SPRA6CdEdZLediS4sVxvja44G
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_ENVIRONMENT=production
MPESA_BASE_URL_SANDBOX=https://sandbox.safaricom.co.ke
MPESA_BASE_URL_PRODUCTION=https://api.safaricom.co.ke
MPESA_CALLBACK_URL=https://YOUR-DOMAIN.vercel.app/api/mpesa/callback
MPESA_TIMEOUT_URL=https://YOUR-DOMAIN.vercel.app/api/mpesa/timeout
WHATSAPP_BUSINESS_PHONE=+254704546916
```

**⚠️ IMPORTANT:** Replace `YOUR-DOMAIN` with your actual Vercel domain after deployment!

### Step 5: Redeploy After Adding Variables
After adding environment variables, trigger a redeploy:
- Go to **Deployments** tab
- Click **"..."** on latest deployment
- Click **"Redeploy"**

---

## 🔧 Post-Deployment Configuration

### 1. Update M-Pesa Callback URLs

After deployment, you'll get a URL like: `https://awesome-technologies-xyz.vercel.app`

Update in **Safaricom Developer Portal**:
1. Go to https://developer.safaricom.co.ke
2. Navigate to your app
3. Update:
   - **Callback URL**: `https://your-domain.vercel.app/api/mpesa/callback`
   - **Timeout URL**: `https://your-domain.vercel.app/api/mpesa/timeout`

### 2. Update Environment Variables
Go back to Vercel and update these variables with your actual domain:
- `MPESA_CALLBACK_URL`
- `MPESA_TIMEOUT_URL`

Then **Redeploy**

### 3. Update Supabase CORS
In Supabase Dashboard → Settings → API:
- Add your Vercel domain to allowed origins
- Example: `https://awesome-technologies-xyz.vercel.app`

### 4. Test Your Deployment

**Test Pages:**
- [ ] Homepage: `https://your-domain.vercel.app`
- [ ] Shop: `https://your-domain.vercel.app/shop.html`
- [ ] Cart: `https://your-domain.vercel.app/cart.html`
- [ ] Checkout: `https://your-domain.vercel.app/cheackout.html`
- [ ] Admin: `https://your-domain.vercel.app/admin-dashboard.html`

**Test API Endpoints:**
```bash
# Health check
curl https://your-domain.vercel.app/api/products

# Login test
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@awesometech.com","password":"your_password"}'
```

**Test M-Pesa:**
1. Go to checkout page
2. Select M-Pesa payment
3. Enter phone number (254XXXXXXXXX)
4. Verify STK push is sent
5. Check payment status updates

---

## ✅ Final Verification

### Check These Features:
- [ ] User registration works
- [ ] User login works
- [ ] Products display correctly
- [ ] Add to cart works
- [ ] Shopping cart persists
- [ ] M-Pesa payment initiates
- [ ] M-Pesa callback receives responses
- [ ] Admin dashboard loads
- [ ] Admin can manage products
- [ ] Contact form submits
- [ ] All images load correctly
- [ ] Mobile responsive design works

---

## 🐛 Common Issues & Solutions

### Issue 1: "Module not found" errors
**Solution:** 
```bash
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Issue 2: Environment variables not working
**Solution:**
- Check spelling matches exactly
- Redeploy after adding variables
- Check for trailing spaces

### Issue 3: CORS errors
**Solution:**
- Verify CORS headers in serverless functions
- Check `vercel.json` headers configuration

### Issue 4: M-Pesa callback not working
**Solution:**
- Verify callback URL is publicly accessible
- Check Safaricom portal has correct URL
- Check Vercel function logs for errors

### Issue 5: API returning 404
**Solution:**
- Check file naming (must match routes)
- Verify `vercel.json` routes configuration
- Check function logs in Vercel dashboard

---

## 📊 Monitoring

### View Logs:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments**
4. Click on a deployment
5. Go to **Functions** tab
6. Click on any function to see logs

### Performance:
- Go to **Analytics** tab in Vercel
- Monitor page views, errors, performance

---

## 🎉 Success!

Once everything is working:
1. Note your Vercel URL
2. (Optional) Add custom domain in Vercel settings
3. Update DNS records if using custom domain
4. Share your live site!

**Your live site:** `https://your-domain.vercel.app`

---

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Supabase + Vercel](https://supabase.com/docs/guides/integrations/vercel)
- [M-Pesa API Docs](https://developer.safaricom.co.ke/docs)

---

**Last Updated:** December 10, 2025
**Project:** Awesome Technologies E-commerce
**Status:** Ready for Deployment ✅
