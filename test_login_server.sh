#!/bin/bash

echo "=== Checking users table schema ==="
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; DESCRIBE users;"

echo ""
echo "=== Checking all users in database ==="
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT id, email, first_name, last_name, role, is_active FROM users;"

echo ""
echo "=== Checking admin@denla.com user ==="
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = 'admin@denla.com';"

echo ""
echo "=== Updating admin@denla.com password ==="
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; UPDATE users SET password_hash = '\$2a\$10\$Ci5Ifi9ZOwi0Hv4oCVNzpOo0fEfl0zyCMTd2NrgL37sjgQgJ.DgBS' WHERE email = 'admin@denla.com';"

echo ""
echo "=== Verifying password update ==="
docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; SELECT email, password_hash FROM users WHERE email = 'admin@denla.com';"

echo ""
echo "=== Testing login via API ==="
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@denla.com","password":"admin123"}' \
  --verbose

echo ""
echo "=== Done ==="
