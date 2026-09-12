# 🚀 Denla Discount Shop - Coolify Deployment Guide

Complete step-by-step guide to deploy Denla Discount Shop on Contabo VPS using Coolify.

---

## 📋 Prerequisites

- Contabo VPS with Ubuntu 20.04+ (minimum 2GB RAM, 2 vCPU)
- Domain name (optional but recommended)
- Coolify installed on your VPS
- MySQL database ready
- SSH access to your server

---

## 🗄️ Step 1: Prepare MySQL Database

### Option A: Using Coolify's Built-in MySQL

1. **In Coolify Dashboard:**
   - Go to `Resources` → `+ New Resource`
   - Select `Database` → `MySQL 8.0`
   - Configure:
     - **Name:** `denla-mysql`
     - **Root Password:** `Hackifyoucan254`
     - **Database Name:** `denla`
     - **Username:** `denla`
     - **Password:** `Hackifyoucan254`
   - Click `Deploy`

2. **Wait for database to start** (check health status)

3. **Get connection details:**
   - Click on the database service
   - Note down the internal hostname (e.g., `denla-mysql`)
   - Port: `3306`

### Option B: Using External MySQL

If you have an existing MySQL server:

```bash
# SSH into your server
mysql -u root -p

# Create database and user
CREATE DATABASE denla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'denla'@'%' IDENTIFIED BY 'Hackifyoucan254';
GRANT ALL PRIVILEGES ON denla.* TO 'denla'@'%';
FLUSH PRIVILEGES;
EXIT;
```

---

## 📦 Step 2: Import Database Schema

1. **SSH into your Contabo server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Upload the schema file** (from your local machine):
   ```bash
   scp backend/database/supabase-schema.sql root@your-server-ip:/tmp/
   ```

3. **Import the schema:**
   ```bash
   # If using Coolify MySQL (get container name)
   docker ps | grep mysql
   
   # Copy file to container
   docker cp /tmp/supabase-schema.sql <mysql-container-name>:/tmp/
   
   # Import into database
   docker exec -i <mysql-container-name> mysql -udenla -pHackifyoucan254 denla < /tmp/supabase-schema.sql
   ```

   **OR if using external MySQL:**
   ```bash
   mysql -u denla -pHackifyoucan254 denla < /tmp/supabase-schema.sql
   ```

4. **Verify import:**
   ```bash
   docker exec -it <mysql-container-name> mysql -udenla -pHackifyoucan254 denla -e "SHOW TABLES;"
   ```

   You should see tables like: `users`, `products`, `categories`, `orders`, `cart_items`, etc.

---

## 🔐 Step 3: Create Admin User

After importing schema, create an admin account:

```bash
# Connect to MySQL
docker exec -it <mysql-container-name> mysql -udenla -pHackifyoucan254 denla

# Run this SQL (password hash is for: admin123)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verified, is_active)
VALUES (
    UUID(),
    'admin@denlashop.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWHvjqyK',
    'Admin',
    'User',
    'admin',
    TRUE,
    TRUE
);
```

**Admin Login Credentials:**
- **Email:** `admin@denlashop.com`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

---

## 🐙 Step 4: Prepare Git Repository

1. **Initialize Git in your project** (if not already done):
   ```bash
   cd "d:\Drew Files\Awesome"
   git init
   git add .
   git commit -m "Initial commit - Denla Discount Shop"
   ```

2. **Push to GitHub/GitLab:**
   ```bash
   # Create a new repository on GitHub/GitLab
   # Then push your code
   git remote add origin https://github.com/yourusername/denla-shop.git
   git branch -M main
   git push -u origin main
   ```

   **OR use Coolify's built-in Git (recommended):**
   - Coolify can pull directly from your local repository
   - No need to push to GitHub if you prefer

---

## 🎯 Step 5: Deploy on Coolify

### 5.1 Create New Application

1. **Login to Coolify Dashboard:**
   - Navigate to `http://your-server-ip:3000` or your Coolify domain

2. **Create New Resource:**
   - Click `+ New Resource`
   - Select `Application`

3. **Choose Source:**
   - **Option A:** Public Repository
     - Select `Public Repository`
     - Paste your GitHub URL: `https://github.com/yourusername/denla-shop.git`
     - Branch: `main`
   
   - **Option B:** Private Repository
     - Connect your GitHub/GitLab account
     - Select your private repository
     - Branch: `main`

### 5.2 Configure Application

1. **General Settings:**
   - **Name:** `denla-shop`
   - **Description:** `Denla Discount Shop - Online Grocery & Household Store`
   - **Build Pack:** `Dockerfile`
   - **Dockerfile Path:** `Dockerfile` (leave as default)
   - **Port:** `5000`
   - **Health Check Path:** `/health`

2. **Domains:**
   - **Option A:** Use Coolify subdomain
     - Enable `Generate Domain`
     - You'll get something like: `denla-shop.coolify.yourdomain.com`
   
   - **Option B:** Use custom domain
     - Add your domain: `shop.yourdomain.com`
     - Make sure DNS A record points to your server IP
     - Enable `Generate SSL Certificate` (automatic Let's Encrypt)

### 5.3 Environment Variables

Click on `Environment Variables` and add the following:

```env
# Node Environment
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=denla-mysql
DB_PORT=3306
DB_USER=denla
DB_PASSWORD=Hackifyoucan254
DB_NAME=denla

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Application URL (use your actual domain)
APP_URL=https://your-domain.com

# CORS Origins (use your actual domain)
CORS_ORIGIN=https://your-domain.com

# M-Pesa Configuration (Optional - add if needed)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_BUSINESS_SHORT_CODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=

# Google OAuth (Optional - add if needed)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**IMPORTANT:**
- Replace `denla-mysql` with your actual MySQL hostname
- If using external MySQL, use the server IP or hostname
- Change `JWT_SECRET` to a random secure string (generate one: `openssl rand -base64 32`)
- Update `APP_URL` and `CORS_ORIGIN` with your actual domain

### 5.4 Network Configuration

1. **If using Coolify MySQL:**
   - Go to `Network` tab
   - Add network connection to your MySQL service
   - This allows the app to communicate with the database

2. **Docker Network:**
   - Coolify automatically handles this
   - Both services should be on the same Docker network

---

## 🚀 Step 6: Deploy!

1. **Click `Deploy` button**
   - Coolify will:
     - Clone your repository
     - Build Docker image
     - Start the container
     - Set up SSL (if domain configured)

2. **Monitor Build Logs:**
   - Click on `Logs` tab
   - Watch the build process
   - Should complete in 2-5 minutes

3. **Check Health:**
   - Wait for `Healthy` status
   - If health check fails, check logs for errors

---

## ✅ Step 7: Verify Deployment

1. **Access Your Application:**
   - Visit: `https://your-domain.com`
   - Or: `https://denla-shop.coolify.yourdomain.com`

2. **Test Health Endpoint:**
   ```bash
   curl https://your-domain.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

3. **Test API:**
   ```bash
   curl https://your-domain.com/api/products?limit=5
   ```
   Should return product data

4. **Login to Admin Panel:**
   - Go to: `https://your-domain.com/admin.html`
   - Email: `admin@denlashop.com`
   - Password: `admin123`

---

## 🔧 Step 8: Post-Deployment Configuration

### Update Admin Password

1. Login to admin panel
2. Go to settings
3. Change admin password immediately

### Import Product Data

If you have product CSV data:

```bash
# SSH to server
ssh root@your-server-ip

# Copy CSV to server
scp kenya_shop_seed_data.csv root@your-server-ip:/tmp/

# Import products (create a simple import script or use MySQL LOAD DATA)
docker exec -i <mysql-container-name> mysql -udenla -pHackifyoucan254 denla

# Then manually insert or create import script
```

### Configure M-Pesa (Optional)

1. Get M-Pesa API credentials from Safaricom
2. Add environment variables in Coolify:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_BUSINESS_SHORT_CODE`
   - `MPESA_PASSKEY`
   - `MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback`
3. Redeploy application

---

## 🔄 Step 9: Updates & Redeployment

### When you make code changes:

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **In Coolify:**
   - Go to your application
   - Click `Redeploy`
   - OR enable `Auto Deploy` for automatic updates on git push

### Rollback:

- Go to `Deployments` tab
- Click on previous successful deployment
- Click `Redeploy`

---

## 📊 Step 10: Monitoring & Logs

### View Logs:
```bash
# In Coolify Dashboard
- Go to your application
- Click `Logs` tab
- Real-time logs display

# OR via SSH
docker logs -f <container-name>
```

### Check Resources:
```bash
docker stats <container-name>
```

### Database Backups:
```bash
# Create backup script
docker exec <mysql-container-name> mysqldump -udenla -pHackifyoucan254 denla > /backups/denla-$(date +%Y%m%d).sql
```

---

## 🐛 Troubleshooting

### Database Connection Failed

**Error:** `ECONNREFUSED` or `Can't connect to MySQL`

**Solutions:**
1. Check database is running:
   ```bash
   docker ps | grep mysql
   ```

2. Verify network connection:
   ```bash
   docker network inspect <network-name>
   ```

3. Test connection from app container:
   ```bash
   docker exec -it <app-container> sh
   nc -zv denla-mysql 3306
   ```

4. Check environment variables:
   - Coolify Dashboard → App → Environment Variables
   - Ensure `DB_HOST` matches MySQL service name

### Health Check Failing

**Error:** Application shows as `Unhealthy`

**Solutions:**
1. Check logs for startup errors
2. Verify port 5000 is exposed
3. Test health endpoint:
   ```bash
   docker exec -it <app-container> sh
   wget -O- http://localhost:5000/health
   ```

### SSL Certificate Issues

**Error:** `ERR_CERT_COMMON_NAME_INVALID`

**Solutions:**
1. Verify DNS is pointing to correct IP
2. Wait 5-10 minutes for DNS propagation
3. In Coolify, go to Domain settings
4. Click `Regenerate SSL Certificate`

### 502 Bad Gateway

**Error:** Nginx shows 502

**Solutions:**
1. Check if container is running
2. Check application logs
3. Verify port configuration (should be 5000)
4. Restart the application

---

## 📝 Important Notes

1. **Security:**
   - Change all default passwords immediately
   - Keep `JWT_SECRET` secure and random
   - Enable firewall on Contabo VPS
   - Use strong database passwords

2. **Backups:**
   - Set up automated MySQL backups
   - Backup frequency: Daily recommended
   - Store backups off-server

3. **Performance:**
   - Monitor resource usage
   - Consider upgrading VPS if needed
   - Enable caching if traffic increases

4. **Updates:**
   - Keep Docker images updated
   - Update Node.js dependencies regularly
   - Monitor security advisories

---

## 🆘 Support & Resources

- **Coolify Docs:** https://coolify.io/docs
- **Docker Docs:** https://docs.docker.com
- **Contabo Support:** https://contabo.com/support

---

## 📞 Database Connection Cheat Sheet

```env
# For Coolify MySQL (internal)
DB_HOST=denla-mysql
DB_PORT=3306

# For external MySQL on same server
DB_HOST=localhost  # or server IP
DB_PORT=3306

# For remote MySQL
DB_HOST=remote-server-ip
DB_PORT=3306
```

---

## ✅ Deployment Checklist

- [ ] Contabo VPS provisioned
- [ ] Coolify installed and accessible
- [ ] MySQL database created (name: denla, user: denla)
- [ ] Database schema imported
- [ ] Admin user created
- [ ] Git repository ready (pushed to GitHub/GitLab)
- [ ] Environment variables configured in Coolify
- [ ] Application deployed successfully
- [ ] Health check passing
- [ ] Domain/SSL configured
- [ ] Admin login tested
- [ ] API endpoints tested
- [ ] Products visible on frontend
- [ ] Admin password changed
- [ ] Backup strategy implemented

---

**🎉 Congratulations! Your Denla Discount Shop is now live!**

Visit your store at: `https://your-domain.com`

Admin panel: `https://your-domain.com/admin.html`
