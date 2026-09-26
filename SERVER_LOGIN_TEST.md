# Server Login Test Commands

Run these commands on your Contabo server (SSH into root@169.58.244.109):

## 1. Check what users exist
```bash
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT id, email, first_name, last_name, role FROM users;"
```

## 2. Update admin password to 'admin123'
```bash
docker exec mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; UPDATE users SET password_hash = '\$2a\$10\$Ci5Ifi9ZOwi0Hv4oCVNzpOo0fEfl0zyCMTd2NrgL37sjgQgJ.DgBS' WHERE email = 'admin@denla.com';"
```

## 3. Verify password was updated
```bash
docker exec mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT email, LEFT(password_hash, 20) as hash_preview FROM users WHERE email = 'admin@denla.com';"
```

## 4. Test login via curl (from server)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@denla.com","password":"admin123"}'
```

## 5. Test login via curl (from external URL)
```bash
curl -X POST http://5nvzq8z6cxtm4hgmb4t8zd8o.169.58.244.109.sslip.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@denla.com","password":"admin123"}'
```

---

## Alternative: Create a new admin user if admin@denla.com doesn't exist

```bash
docker exec mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified) VALUES (UUID(), 'admin@denla.com', '\$2a\$10\$Ci5Ifi9ZOwi0Hv4oCVNzpOo0fEfl0zyCMTd2NrgL37sjgQgJ.DgBS', 'Admin', 'User', 'admin', 1, 1);"
```

---

## Expected Results

- Step 2 should return: `Query OK, 1 row affected`
- Step 4 should return: `{"success":true,"message":"Login successful","token":"...","user":{...}}`
- Step 5 should return the same JSON with a valid JWT token
