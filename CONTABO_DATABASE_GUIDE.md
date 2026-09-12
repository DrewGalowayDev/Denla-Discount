# 🗄️ Contabo Database Setup & Import Guide

Complete guide to export local database and import to Contabo server.

---

## 📦 Your Contabo MySQL Container

Based on your `docker ps` output:

**Container ID:** `mxcz5sejqtboqpb2wtkjgchn`
**Image:** `mysql:8`
**Status:** Up 7 hours (healthy)

---

## Step 1: List Databases on Contabo

SSH into your Contabo server and run:

```bash
# List all databases
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "SHOW DATABASES;"

# Check if denla database exists
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SHOW TABLES;"
```

### If database doesn't exist, create it:

```bash
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "CREATE DATABASE IF NOT EXISTS denla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## Step 2: Export Local Database

On your **local Windows machine**, run:

```bash
cd "d:\Drew Files\Awesome"
export-database.bat
```

This will create a file like: `denla_database_20260911_143052.sql`

### Manual Export (Alternative):

```bash
mysqldump -h localhost -u root -pHackifyoucan254 ^
  --databases denla ^
  --single-transaction ^
  --routines ^
  --triggers ^
  --events ^
  --add-drop-database ^
  --hex-blob ^
  --default-character-set=utf8mb4 ^
  --result-file=denla_full_export.sql
```

---

## Step 3: Upload to Contabo Server

### Option A: Using SCP (Recommended)

From your local machine (PowerShell):

```powershell
# Replace YOUR_SERVER_IP with actual IP
scp denla_database_*.sql root@YOUR_SERVER_IP:/tmp/

# Example:
# scp denla_database_20260911_143052.sql root@159.69.123.45:/tmp/
```

### Option B: Using FileZilla/WinSCP

1. Open FileZilla or WinSCP
2. Connect to your server:
   - Host: Your Contabo IP
   - Username: root
   - Password: Your root password
   - Port: 22
3. Upload the `.sql` file to `/tmp/` directory

### Option C: Copy-Paste for Small Databases

If database is small (<5MB), you can copy-paste the SQL content directly in MySQL shell.

---

## Step 4: Import to Contabo MySQL

SSH into your Contabo server:

```bash
# Navigate to where you uploaded the file
cd /tmp

# Verify file exists
ls -lh denla_database_*.sql

# Import the database
docker exec -i mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 < denla_database_20260911_143052.sql

# Or if you want to see the import process:
cat denla_database_20260911_143052.sql | docker exec -i mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254
```

---

## Step 5: Verify Import

```bash
# Check database exists
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "SHOW DATABASES;"

# List tables in denla database
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SHOW TABLES;"

# Count products
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT COUNT(*) as total_products FROM products;"

# Count categories
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT COUNT(*) as total_categories FROM categories;"

# List first 5 products
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT id, name, selling_price FROM products LIMIT 5;"
```

---

## Step 6: Check Admin User

```bash
# Verify admin user exists
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT id, email, role FROM users WHERE role='admin';"
```

### If admin doesn't exist, create it:

```bash
docker exec -i mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 denla << 'EOF'
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
EOF
```

**Admin credentials:**
- Email: `admin@denlashop.com`
- Password: `admin123`

---

## 🖼️ Step 7: Handle Product Images

The database export includes image **paths** (e.g., `/img/items/product.jpg`), but not the actual image files.

### Option A: Include images in your Git repository (Simplest)

Images are already in: `d:\Drew Files\Awesome\public\img\items\`

When you deploy via Coolify from Git, images will be included automatically.

### Option B: Upload images separately

```bash
# On local machine, create tar archive
cd "d:\Drew Files\Awesome\public"
tar -czf denla-images.tar.gz img/

# Upload to Contabo
scp denla-images.tar.gz root@YOUR_SERVER_IP:/tmp/

# On Contabo, extract to application directory
# (Do this after deploying the app)
docker exec -it YOUR_APP_CONTAINER_ID sh
cd /app/public
tar -xzf /tmp/denla-images.tar.gz
```

### Option C: Use CDN (Best for production)

Upload images to:
- Cloudinary
- AWS S3
- DigitalOcean Spaces
- Contabo Object Storage

Then update database image paths.

---

## 🚀 Complete Import Command Chain

Copy-paste this entire block on your Contabo server:

```bash
# 1. Create database if it doesn't exist
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "CREATE DATABASE IF NOT EXISTS denla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Import the SQL file (replace filename with yours)
docker exec -i mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 < /tmp/denla_database_20260911_143052.sql

# 3. Verify tables
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SHOW TABLES;"

# 4. Count records
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT 'Products' as Table_Name, COUNT(*) as Count FROM products UNION SELECT 'Categories', COUNT(*) FROM categories UNION SELECT 'Users', COUNT(*) FROM users;"

# 5. Verify admin user
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT email, role FROM users WHERE role='admin';"
```

---

## 🧹 Cleanup After Import

```bash
# Remove SQL file from server
rm /tmp/denla_database_*.sql

# Remove image archive (if uploaded)
rm /tmp/denla-images.tar.gz
```

---

## 🐛 Troubleshooting

### "Access denied for user"

```bash
# Check MySQL users
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u root -p -e "SELECT user, host FROM mysql.user;"

# Create denla user if doesn't exist
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u root -p << 'EOF'
CREATE USER IF NOT EXISTS 'denla'@'%' IDENTIFIED BY 'Hackifyoucan254';
GRANT ALL PRIVILEGES ON denla.* TO 'denla'@'%';
FLUSH PRIVILEGES;
EOF
```

### "Database already exists" error

```bash
# Drop and recreate
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "DROP DATABASE IF EXISTS denla; CREATE DATABASE denla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### "Container not found"

```bash
# List all MySQL containers
docker ps | grep mysql

# Use the correct container ID or name
```

### Import seems stuck

```bash
# Check import progress (in another terminal)
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "SHOW PROCESSLIST;"
```

---

## ✅ Success Criteria

After import, you should have:

- ✅ Database `denla` exists
- ✅ All tables created (users, products, categories, orders, etc.)
- ✅ Products with data (~103 products from seed)
- ✅ Categories (~5-7 categories)
- ✅ Admin user created
- ✅ Image paths in products table
- ✅ All foreign keys working

---

## 📋 Quick Command Reference

```bash
# Connect to MySQL
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 denla

# Backup database (on Contabo)
docker exec mxcz5sejqtboqpb2wtkjgchn mysqldump -u denla -pHackifyoucan254 denla > /backup/denla_backup_$(date +%Y%m%d).sql

# View MySQL logs
docker logs mxcz5sejqtboqpb2wtkjgchn

# Restart MySQL container
docker restart mxcz5sejqtboqpb2wtkjgchn
```

---

**Next Step:** After database import is complete, proceed with Coolify application deployment using `COOLIFY_DEPLOYMENT_GUIDE.md`
