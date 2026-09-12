# 🚀 Denla Discount Shop - Deployment Documentation

Complete deployment package for hosting on Contabo VPS using Coolify and Docker.

---

## 📁 Deployment Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Container image definition |
| `.dockerignore` | Files excluded from Docker build |
| `docker-compose.yml` | Local multi-container setup |
| `.env.example` | Environment variables template |
| **Documentation** | |
| `DEPLOYMENT_SUMMARY.md` | Quick 5-step deployment guide |
| `COOLIFY_DEPLOYMENT_GUIDE.md` | Complete step-by-step instructions |
| `DOCKER_QUICK_START.md` | Docker commands reference |
| **Scripts** | |
| `test-docker-build.bat` | Test Docker build locally |
| `cleanup-docker-test.bat` | Remove test containers/images |

---

## 🎯 Quick Start

### For First-Time Deployment:

1. **Read this first:** `DEPLOYMENT_SUMMARY.md` (5-minute read)
2. **Follow detailed guide:** `COOLIFY_DEPLOYMENT_GUIDE.md`
3. **Test locally (optional):** Run `test-docker-build.bat`

### For Quick Reference:

- **Environment variables:** Check `.env.example`
- **Docker commands:** See `DOCKER_QUICK_START.md`
- **Troubleshooting:** Section in `COOLIFY_DEPLOYMENT_GUIDE.md`

---

## 🔧 Prerequisites

### Server Requirements:
- ✅ Contabo VPS (minimum 2GB RAM, 2 vCPU)
- ✅ Ubuntu 20.04+ installed
- ✅ Coolify installed and configured
- ✅ Domain name (optional but recommended)
- ✅ SSH access

### Database Setup:
- ✅ MySQL 8.0+
- ✅ Database: `denla`
- ✅ User: `denla`
- ✅ Password: `Hackifyoucan254`

### Local Testing (optional):
- Docker Desktop installed
- Git installed
- Access to MySQL database

---

## 📖 Deployment Guides

### 1. Quick Deployment (Recommended for experienced users)
**File:** `DEPLOYMENT_SUMMARY.md`

**Time:** 15-30 minutes

**Best for:**
- Users familiar with Docker and Coolify
- Quick deployment with minimal explanation
- Reference during deployment

**Contains:**
- 5-step setup process
- Environment variables copy-paste
- Post-deployment checklist
- Common issues & fixes

---

### 2. Complete Deployment Guide (Recommended for beginners)
**File:** `COOLIFY_DEPLOYMENT_GUIDE.md`

**Time:** 45-60 minutes (including testing)

**Best for:**
- First-time Coolify users
- Detailed step-by-step instructions
- Understanding each deployment step
- Troubleshooting reference

**Contains:**
- 10 detailed steps
- Database setup options
- Schema import instructions
- SSL/Domain configuration
- Monitoring and maintenance
- Comprehensive troubleshooting

---

### 3. Docker Reference Guide
**File:** `DOCKER_QUICK_START.md`

**Time:** Quick reference

**Best for:**
- Local testing before deployment
- Docker command reference
- Understanding Docker configuration
- Debugging Docker issues

**Contains:**
- Local Docker testing commands
- Environment variables reference
- Database connection strings
- Cleanup commands
- Push to Docker Hub (optional)

---

## 🧪 Testing Locally (Before Coolify Deployment)

### Why Test Locally?
- Verify Docker build works
- Catch configuration errors early
- Test database connection
- Ensure application starts correctly

### How to Test:

**Option 1: Using Test Script (Easiest)**
```bash
# Run the automated test
test-docker-build.bat

# View results
# If successful, you'll see "SUCCESS!" message

# When done, cleanup
cleanup-docker-test.bat
```

**Option 2: Manual Docker Commands**
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

# Test in browser
# Visit: http://localhost:5000
```

**Option 3: Using Docker Compose**
```bash
# Start all services
docker-compose up

# Stop services
docker-compose down
```

---

## 🔐 Security Configuration

### Required Changes Before Production:

1. **JWT Secret:**
   ```bash
   # Generate secure secret
   openssl rand -base64 32
   
   # Update in Coolify environment variables
   JWT_SECRET=<generated-secret>
   ```

2. **Admin Password:**
   - Login: `admin@denlashop.com`
   - Default: `admin123`
   - ⚠️ **Change immediately after deployment!**

3. **Database Password:**
   - Current: `Hackifyoucan254`
   - Consider changing for production
   - Update in both MySQL and environment variables

4. **Session Secret:**
   ```bash
   # Generate secure session secret
   openssl rand -hex 32
   
   # Add to environment variables
   SESSION_SECRET=<generated-secret>
   ```

---

## 📋 Deployment Checklist

### Pre-Deployment:
- [ ] Read `DEPLOYMENT_SUMMARY.md`
- [ ] Review `.env.example`
- [ ] Test Docker build locally (optional)
- [ ] Prepare database credentials
- [ ] Have domain name ready (if using custom domain)
- [ ] Git repository ready (pushed to GitHub/GitLab)

### Coolify Setup:
- [ ] MySQL service created in Coolify
- [ ] Database schema imported
- [ ] Admin user created
- [ ] Application created in Coolify
- [ ] Environment variables configured
- [ ] Domain/SSL configured

### Post-Deployment:
- [ ] Application health check passing
- [ ] Homepage accessible
- [ ] API endpoints working
- [ ] Admin login successful
- [ ] Admin password changed
- [ ] SSL certificate active
- [ ] Products visible on shop

### Optional Configuration:
- [ ] M-Pesa integration configured
- [ ] Google OAuth configured
- [ ] Email notifications configured
- [ ] Backup strategy implemented
- [ ] Monitoring setup

---

## 🌐 Access Points After Deployment

| URL | Purpose | Credentials |
|-----|---------|-------------|
| `https://your-domain.com` | Customer Store | - |
| `https://your-domain.com/admin.html` | Admin Panel | admin@denlashop.com / admin123 |
| `https://your-domain.com/pos.html` | POS System | Admin account |
| `https://your-domain.com/health` | Health Check | - |
| `https://your-domain.com/api/products` | API Test | - |

---

## 🆘 Need Help?

### Common Issues:

**"Docker build fails"**
- Check `Dockerfile` syntax
- Verify all files exist
- Check `.dockerignore` isn't excluding needed files
- See: `DOCKER_QUICK_START.md` → Troubleshooting

**"Database connection error"**
- Verify MySQL is running
- Check `DB_HOST` matches service name
- Test connection from container
- See: `COOLIFY_DEPLOYMENT_GUIDE.md` → Troubleshooting

**"Health check failing"**
- Wait 1-2 minutes for startup
- Check container logs
- Verify port 5000 exposed
- See: `DEPLOYMENT_SUMMARY.md` → Common Issues

**"502 Bad Gateway"**
- Container might not be running
- Check build logs for errors
- Verify Docker build successful
- Restart application in Coolify

---

## 📚 Additional Resources

### Project Documentation:
- `README.md` - Project overview
- `ARCHITECTURE.md` - System architecture
- `backend/database/SCHEMA_DOCUMENTATION.md` - Database schema

### Feature Guides:
- `CART_SYSTEM_GUIDE.md` - Cart functionality
- `CATEGORY_SYSTEM_GUIDE.md` - Category management
- `backend/mpesa/README.md` - M-Pesa integration

### External Resources:
- [Coolify Documentation](https://coolify.io/docs)
- [Docker Documentation](https://docs.docker.com)
- [Contabo VPS Guide](https://contabo.com/support)

---

## 🔄 Updates & Maintenance

### Deploying Updates:

1. **Make code changes locally**
2. **Push to Git:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
3. **In Coolify:**
   - Click `Redeploy` button
   - OR enable `Auto Deploy` for automatic updates

### Database Backups:

```bash
# Manual backup
docker exec <mysql-container> mysqldump -udenla -pHackifyoucan254 denla > backup-$(date +%Y%m%d).sql

# Automated backups (add to crontab)
0 2 * * * /path/to/backup-script.sh
```

### Monitoring:

- Check logs regularly in Coolify Dashboard
- Monitor resource usage (CPU, RAM, Disk)
- Set up alerts for downtime
- Review access logs for security

---

## 📞 Support

For issues specific to:
- **Denla Shop:** Check documentation files in this directory
- **Coolify:** https://coolify.io/docs
- **Docker:** https://docs.docker.com
- **Contabo:** https://contabo.com/support

---

## ✅ Success Criteria

Your deployment is successful when:
- ✅ Application accessible via HTTPS
- ✅ Health check returns OK status
- ✅ Admin panel accessible and functional
- ✅ Products load on shop page
- ✅ Cart functionality works
- ✅ SSL certificate active
- ✅ No errors in logs

---

## 🎉 Ready to Deploy?

1. Start with: **`DEPLOYMENT_SUMMARY.md`**
2. Follow: **`COOLIFY_DEPLOYMENT_GUIDE.md`**
3. Reference: **`DOCKER_QUICK_START.md`** as needed

**Good luck with your deployment! 🚀**

---

*Last Updated: 2026*
*Version: 1.0*
