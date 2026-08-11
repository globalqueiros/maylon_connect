-- Local MySQL bootstrap for Portal Connect (dev)
CREATE DATABASE IF NOT EXISTS smartmobility_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS maylon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ursoft'@'localhost' IDENTIFIED BY 'Ursoft@00001';
CREATE USER IF NOT EXISTS 'ursoft'@'127.0.0.1' IDENTIFIED BY 'Ursoft@00001';
CREATE USER IF NOT EXISTS 'ursoft'@'%' IDENTIFIED BY 'Ursoft@00001';

ALTER USER 'ursoft'@'localhost' IDENTIFIED BY 'Ursoft@00001';
ALTER USER 'ursoft'@'127.0.0.1' IDENTIFIED BY 'Ursoft@00001';
ALTER USER 'ursoft'@'%' IDENTIFIED BY 'Ursoft@00001';

GRANT ALL PRIVILEGES ON smartmobility_db.* TO 'ursoft'@'localhost';
GRANT ALL PRIVILEGES ON smartmobility_db.* TO 'ursoft'@'127.0.0.1';
GRANT ALL PRIVILEGES ON smartmobility_db.* TO 'ursoft'@'%';
GRANT ALL PRIVILEGES ON maylon_db.* TO 'ursoft'@'localhost';
GRANT ALL PRIVILEGES ON maylon_db.* TO 'ursoft'@'127.0.0.1';
GRANT ALL PRIVILEGES ON maylon_db.* TO 'ursoft'@'%';
FLUSH PRIVILEGES;

USE smartmobility_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NULL,
  user_type VARCHAR(40) NULL DEFAULT 'passageiro',
  profile_image TEXT NULL,
  identification_number VARCHAR(40) NULL,
  identification_type VARCHAR(20) NULL,
  phone_verified_at DATETIME NULL,
  email_verified_at DATETIME NULL,
  reset_token VARCHAR(255) NULL,
  reset_expires DATETIME NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_users_email (email)
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent TEXT NULL,
  refresh_token TEXT NULL,
  created_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_sessions_user (user_id)
);

CREATE TABLE IF NOT EXISTS beneficios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL,
  valor DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TINYINT(1) NOT NULL DEFAULT 1,
  tipo VARCHAR(40) NULL,
  descricao TEXT NULL,
  imagem TEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS banner_setups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NULL,
  image VARCHAR(500) NULL,
  link VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS usuario_beneficios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT UNSIGNED NOT NULL,
  beneficio_id BIGINT UNSIGNED NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 0,
  metodo_pagamento VARCHAR(40) NULL,
  status_assinatura VARCHAR(40) NOT NULL DEFAULT 'pendente',
  stripe_customer_id VARCHAR(120) NULL,
  stripe_subscription_id VARCHAR(120) NULL,
  stripe_payment_method_id VARCHAR(120) NULL,
  btg_authorization_id VARCHAR(120) NULL,
  btg_contract VARCHAR(40) NULL,
  btg_tx_id VARCHAR(80) NULL,
  btg_emv TEXT NULL,
  btg_qr_url TEXT NULL,
  pix_stage VARCHAR(40) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ub_usuario_beneficio (usuario_id, beneficio_id)
);

CREATE TABLE IF NOT EXISTS trip_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NULL,
  driver_id BIGINT UNSIGNED NULL,
  pickup_address VARCHAR(500) NULL,
  dropoff_address VARCHAR(500) NULL,
  destination_address VARCHAR(500) NULL,
  pickup_city VARCHAR(120) NULL,
  pickup_state VARCHAR(80) NULL,
  destination_city VARCHAR(120) NULL,
  destination_state VARCHAR(80) NULL,
  dropoff_city VARCHAR(120) NULL,
  dropoff_state VARCHAR(80) NULL,
  estimated_fare DECIMAL(12,2) NULL DEFAULT 0,
  actual_fare DECIMAL(12,2) NULL DEFAULT 0,
  current_status VARCHAR(40) NULL DEFAULT 'completed',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tr_customer (customer_id),
  KEY idx_tr_driver (driver_id)
);

CREATE TABLE IF NOT EXISTS trip_request_coordinates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_request_id BIGINT UNSIGNED NOT NULL,
  pickup_address VARCHAR(500) NULL,
  destination_address VARCHAR(500) NULL,
  pickup_city VARCHAR(120) NULL,
  pickup_state VARCHAR(80) NULL,
  destination_city VARCHAR(120) NULL,
  destination_state VARCHAR(80) NULL,
  PRIMARY KEY (id),
  KEY idx_trc_trip (trip_request_id)
);

INSERT INTO beneficios (id, titulo, valor, status, tipo, descricao, imagem)
VALUES
  (1, 'Plano Mensal Connect', 49.90, 1, 'ambos', 'Benefício local de desenvolvimento', NULL),
  (2, 'Plano Premium Connect', 89.90, 1, 'ambos', 'Benefício premium local', NULL)
ON DUPLICATE KEY UPDATE
  titulo = VALUES(titulo),
  valor = VALUES(valor),
  status = VALUES(status),
  tipo = VALUES(tipo);

INSERT INTO banner_setups (id, title, image, link, is_active)
VALUES (1, 'Bem-vindo ao Portal Connect', NULL, '/passageiro', 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  is_active = VALUES(is_active);
