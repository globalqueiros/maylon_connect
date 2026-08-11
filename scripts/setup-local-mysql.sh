#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SQL_FILE="$ROOT_DIR/scripts/setup-local-mysql.sql"
EMAIL="${LOCAL_LOGIN_EMAIL:-nycollasqueiros16@gmail.com}"
PLAIN_PASSWORD="${LOCAL_LOGIN_PASSWORD:-MaylonLocal123!}"

echo "==> Applying schema as MySQL root (sudo mysql)..."
sudo mysql < "$SQL_FILE"

HASH="$(
  cd "$ROOT_DIR" && node -e '
    const bcrypt = require("bcryptjs");
    const password = process.argv[1];
    console.log(bcrypt.hashSync(password, 10));
  ' "$PLAIN_PASSWORD"
)"

echo "==> Seeding local login user: $EMAIL"
sudo mysql smartmobility_db <<EOF
INSERT INTO users (
  full_name, phone, email, password, user_type,
  identification_number, identification_type, email_verified_at
) VALUES (
  'Nycollas Queiros',
  '11999999999',
  '${EMAIL}',
  '${HASH}',
  'passageiro',
  '00000000000',
  'CPF',
  NOW()
)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  user_type = VALUES(user_type),
  full_name = VALUES(full_name);

SET @uid := (SELECT id FROM users WHERE email = '${EMAIL}' LIMIT 1);

INSERT INTO trip_requests (
  customer_id, pickup_address, dropoff_address, destination_address,
  pickup_city, pickup_state, destination_city, destination_state,
  estimated_fare, actual_fare, current_status, created_at
) VALUES
  (@uid, 'Av. Paulista, 1000', 'Rua Augusta, 200', 'Rua Augusta, 200', 'São Paulo', 'SP', 'São Paulo', 'SP', 35.50, 35.50, 'completed', NOW() - INTERVAL 2 DAY),
  (@uid, 'Aeroporto GRU', 'Hotel Ibirapuera', 'Hotel Ibirapuera', 'Guarulhos', 'SP', 'São Paulo', 'SP', 120.00, 118.40, 'completed', NOW() - INTERVAL 1 DAY)
ON DUPLICATE KEY UPDATE customer_id = customer_id;
EOF

echo "==> Verifying app user connection..."
mysql -h127.0.0.1 -uursoft -p'Ursoft@00001' smartmobility_db -e "SELECT id, email, user_type FROM users WHERE email='${EMAIL}';"

echo
echo "Local MySQL ready."
echo "Login email:    $EMAIL"
echo "Login password: $PLAIN_PASSWORD"
echo "DB: 127.0.0.1 / ursoft / smartmobility_db"
