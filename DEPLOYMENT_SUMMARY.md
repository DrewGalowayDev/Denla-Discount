# 📦 Denla Discount Shop - Deployment Summary

Quick reference for deploying to Coolify on Contabo VPS.

---

## 🎯 Quick Setup (5 Steps)

### 1. Database Setup
```sql
CREATE DATABASE denla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'denla'@'%' IDENTIFIED BY 'Hackifyoucan254';
GRANT ALL PRIVILEGES ON denla.* TO 'denla'@'%';
FLUSH PRIVILEGES;
```

### 2. Import Schema
```bash
mysql -u denla -pHackifyoucan254 denla < backend/database/supabase-schema.sql
```

### 3. Create Admin User
```sql
INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verified, is_active)
VALUES (
    UUID(),
    'admin@denlashop.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWHvjqyK',
    'Admin', 'User', 'admin', TRUE, TRUE
);
```

### 4. Push to Git
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 5. Deploy on Coolify
- New Resource → Application → Dockerfile
- Connect Git repository
- Add environment variables (see below)
- Click Deploy!

---

## 🔧 Coolify Environment Variables

Copy-paste these into Coolify Dashboard → Environment Variables:

```env
NODE_ENV=production
PORT=5000
DB_HOST=denla-mysql
DB_PORT=3306
DB_USER=denla
DB_PASSWORD=Hackifyoucan254
DB_NAME=denla
JWT_SECRET=CHANGE-THIS-TO-RANDOM-STRING
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
APP_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

**⚠️ Important:**
- Replace `JWT_SECRET` with random string: `openssl rand -base64 32`
- Replace `your-domain.com` with your actual domain
- If using external MySQL, change `DB_HOST` to server IP

---

## 🔐 Default Admin Credentials

**After deployment, login at:** `https://your-domain.com/admin.html`

- **Email:** `admin@denlashop.com`
- **Password:** `admin123`

⚠️ **Change password immediately after first login!**

---

## 📋 Coolify Configuration

| Setting | Value |
|---------|-------|
| **Build Pack** | Dockerfile |
| **Dockerfile Path** | `Dockerfile` |
| **Port** | `5000` |
| **Health Check** | `/health` |
| **Branch** | `main` |

---

## 🌐 Domain Setup

### Option A: Coolify Subdomain
- Enable "Generate Domain"
- Get: `denla-shop.coolify.yourdomain.com`

### Option B: Custom Domain
1. Add A record: `shop.yourdomain.com` → `your-server-ip`
2. In Coolify, add domain: `shop.yourdomain.com`
3. Enable "Generate SSL Certificate"
4. Wait 5-10 minutes for SSL

---

## ✅ Post-Deployment Checklist

- [ ] Application deployed successfully
- [ ] Health check passing (`/health` returns OK)
- [ ] Homepage loads: `https://your-domain.com`
- [ ] API working: `https://your-domain.com/api/products`
- [ ] Admin login successful
- [ ] Admin password changed
- [ ] Products visible on shop page
- [ ] SSL certificate active (HTTPS working)

---

## 🐛 Common Issues & Fixes

### "Database connection failed"
```bash
# Check DB_HOST matches MySQL service name
# For Coolify MySQL: use service name (e.g., denla-mysql)
# For external MySQL: use IP address
```

### "Health check failing"
```bash
# Check logs in Coolify Dashboard
# Verify port 5000 is exposed
# Wait 1-2 minutes for app startup
```

### "502 Bad Gateway"
```bash
# Container might not be running
# Check build logs for errors
# Verify Dockerfile builds successfully locally
```

---

## 📁 Files Created

- ✅ `Dockerfile` - Container image configuration
- ✅ `.dockerignore` - Files to exclude from Docker build
- ✅ `docker-compose.yml` - Local testing configuration
- ✅ `.env.example` - Environment variables template
- ✅ `COOLIFY_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- ✅ `DOCKER_QUICK_START.md` - Docker commands reference
- ✅ `DEPLOYMENT_SUMMARY.md` - This quick reference

---

## 🚀 Test Locally First

Before deploying to Coolify, test locally:

```bash
# Build image
docker build -t denla-shop .

# Run container
docker run -p 5000:5000 \
  -e DB_HOST=host.docker.internal \
  -e DB_USER=denla \
  -e DB_PASSWORD=Hackifyoucan254 \
  -e DB_NAME=denla \
  -e JWT_SECRET=test-secret \
  denla-shop

# Test
curl http://localhost:5000/health
```

---

## 📞 Quick Commands

```bash
# Generate JWT Secret
openssl rand -base64 32

# Test database connection
mysql -h denla-mysql -u denla -pHackifyoucan254 denla

# View container logs
docker logs -f <container-name>

# Access container shell
docker exec -it <container-name> sh

# Backup database
mysqldump -u denla -pHackifyoucan254 denla > backup.sql
```

---

## 📚 Documentation Links

- **Full Guide:** `COOLIFY_DEPLOYMENT_GUIDE.md`
- **Docker Commands:** `DOCKER_QUICK_START.md`
- **Environment Config:** `.env.example`

---

## 🎉 You're Ready!

1. Review this summary
2. Follow 5-step setup above
3. Deploy on Coolify
4. Visit your live store!

**Need help?** Check `COOLIFY_DEPLOYMENT_GUIDE.md` for detailed instructions.
