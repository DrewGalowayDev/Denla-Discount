# 🐳 Docker Quick Start Guide

Quick reference for Docker commands and local testing before deploying to Coolify.

---

## 🚀 Local Docker Testing

### 1. Build the Docker Image

```bash
cd "d:\Drew Files\Awesome"
docker build -t denla-shop:latest .
```

### 2. Run Locally (with external MySQL)

```bash
docker run -d \
  --name denla-shop \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_USER=denla \
  -e DB_PASSWORD=Hackifyoucan254 \
  -e DB_NAME=denla \
  -e JWT_SECRET=your-super-secret-jwt-key \
  -e JWT_EXPIRES_IN=7d \
  denla-shop:latest
```

### 3. Test with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Check Logs

```bash
docker logs -f denla-shop
```

### 5. Access Container Shell

```bash
docker exec -it denla-shop sh
```

### 6. Test Health Endpoint

```bash
curl http://localhost:5000/health
```

---

## 🧹 Cleanup Commands

```bash
# Stop and remove container
docker stop denla-shop
docker rm denla-shop

# Remove image
docker rmi denla-shop:latest

# Clean up all unused Docker resources
docker system prune -a
```

---

## 📦 Push to Docker Hub (Optional)

If you want to use Docker Hub instead of building on Coolify:

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag denla-shop:latest yourusername/denla-shop:latest

# Push to Docker Hub
docker push yourusername/denla-shop:latest
```

Then in Coolify, use: `yourusername/denla-shop:latest`

---

## 🔍 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs denla-shop

# Check if port is already in use
netstat -ano | findstr :5000

# Kill process using port
taskkill /PID <PID> /F
```

### Database connection fails
```bash
# For Windows/Mac Docker Desktop
# Use host.docker.internal instead of localhost

# For Linux
# Use docker0 bridge IP or host network mode
docker run --network host ...
```

### Permission errors
```bash
# Run as root (not recommended for production)
docker run --user root ...
```

---

## 📋 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | production | Node environment |
| `PORT` | Yes | 5000 | Application port |
| `DB_HOST` | Yes | localhost | MySQL host |
| `DB_PORT` | Yes | 3306 | MySQL port |
| `DB_USER` | Yes | denla | Database user |
| `DB_PASSWORD` | Yes | - | Database password |
| `DB_NAME` | Yes | denla | Database name |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `JWT_EXPIRES_IN` | No | 7d | JWT expiry time |
| `RATE_LIMIT_WINDOW_MS` | No | 900000 | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per window |

---

## 🎯 Quick Deploy to Coolify

1. **Push code to Git:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **In Coolify:**
   - New Application → Dockerfile
   - Connect Git repository
   - Add environment variables
   - Deploy!

3. **Monitor:**
   - Check build logs
   - Wait for health check to pass
   - Visit your domain

---

## 💾 Database Connection Strings

### For Coolify internal MySQL:
```env
DB_HOST=denla-mysql
```

### For localhost (Docker Desktop):
```env
DB_HOST=host.docker.internal
```

### For external server:
```env
DB_HOST=192.168.1.100
```

---

## 🔐 Generate Secure JWT Secret

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## ✅ Pre-Deployment Checklist

- [ ] Dockerfile created
- [ ] .dockerignore configured
- [ ] Local build successful
- [ ] Local run successful
- [ ] Health check passing
- [ ] Database schema imported
- [ ] Environment variables ready
- [ ] Git repository pushed
- [ ] Ready for Coolify deployment

---

**Next Step:** See `COOLIFY_DEPLOYMENT_GUIDE.md` for full deployment instructions.
