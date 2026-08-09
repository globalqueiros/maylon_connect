-- Run on smartmobility_db (the DB_* connection).
-- If a column already exists, skip that line / ignore the duplicate-column error.

ALTER TABLE usuario_beneficios ADD COLUMN metodo_pagamento VARCHAR(40) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN status_assinatura VARCHAR(30) NULL DEFAULT 'pendente';
ALTER TABLE usuario_beneficios ADD COLUMN stripe_customer_id VARCHAR(120) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN stripe_subscription_id VARCHAR(120) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN stripe_payment_method_id VARCHAR(120) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN card_brand VARCHAR(40) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN card_last4 VARCHAR(4) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN btg_authorization_id VARCHAR(80) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN btg_txid VARCHAR(80) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN btg_charge_id VARCHAR(80) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN pix_emv TEXT NULL;
ALTER TABLE usuario_beneficios ADD COLUMN pix_etapa VARCHAR(30) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN pedido_codigo VARCHAR(40) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN valor_cobrado DECIMAL(10,2) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN proxima_cobranca DATE NULL;
ALTER TABLE usuario_beneficios ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS pagamento_assinaturas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  beneficio_id BIGINT NOT NULL,
  usuario_beneficio_id BIGINT NULL,
  gateway VARCHAR(20) NOT NULL,
  metodo VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL,
  amount DECIMAL(10,2) NULL,
  currency VARCHAR(8) DEFAULT 'BRL',
  external_id VARCHAR(120) NULL,
  pedido_codigo VARCHAR(40) NULL,
  payload_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pag_user_ben (usuario_id, beneficio_id),
  INDEX idx_pag_external (external_id)
);
