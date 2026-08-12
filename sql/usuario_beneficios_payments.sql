-- Rode no MySQL do projeto (cPanel / deploy).
-- Se alguma coluna já existir, ignore o erro correspondente e continue.

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
  card_brand VARCHAR(40) NULL,
  card_last4 VARCHAR(8) NULL,
  btg_authorization_id VARCHAR(120) NULL,
  btg_contract VARCHAR(40) NULL,
  btg_tx_id VARCHAR(80) NULL,
  btg_txid VARCHAR(80) NULL,
  btg_charge_id VARCHAR(120) NULL,
  btg_emv TEXT NULL,
  pix_emv TEXT NULL,
  btg_qr_url TEXT NULL,
  pix_stage VARCHAR(40) NULL,
  pix_etapa VARCHAR(40) NULL,
  pedido_codigo VARCHAR(64) NULL,
  valor_cobrado DECIMAL(12,2) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ub_usuario_beneficio (usuario_id, beneficio_id),
  KEY idx_ub_stripe_sub (stripe_subscription_id),
  KEY idx_ub_btg_auth (btg_authorization_id),
  KEY idx_ub_btg_tx (btg_tx_id),
  KEY idx_ub_pedido (pedido_codigo)
);

CREATE TABLE IF NOT EXISTS pagamento_assinaturas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT UNSIGNED NOT NULL,
  beneficio_id BIGINT UNSIGNED NOT NULL,
  usuario_beneficio_id BIGINT UNSIGNED NULL,
  gateway VARCHAR(40) NOT NULL,
  metodo VARCHAR(40) NOT NULL,
  status VARCHAR(60) NOT NULL,
  amount DECIMAL(12,2) NULL,
  external_id VARCHAR(120) NULL,
  pedido_codigo VARCHAR(64) NULL,
  payload_json LONGTEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pag_pedido (pedido_codigo),
  KEY idx_pag_usuario (usuario_id)
);

-- Migração para tabelas já existentes:
ALTER TABLE usuario_beneficios ADD COLUMN metodo_pagamento VARCHAR(40) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN status_assinatura VARCHAR(40) NOT NULL DEFAULT 'pendente';
ALTER TABLE usuario_beneficios ADD COLUMN stripe_customer_id VARCHAR(120) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN stripe_subscription_id VARCHAR(120) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN stripe_payment_method_id VARCHAR(120) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN card_brand VARCHAR(40) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN card_last4 VARCHAR(8) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN btg_authorization_id VARCHAR(120) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN btg_contract VARCHAR(40) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN btg_tx_id VARCHAR(80) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN btg_txid VARCHAR(80) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN btg_charge_id VARCHAR(120) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN btg_emv TEXT NULL;
ALTER TABLE usuario_beneficios ADD COLUMN pix_emv TEXT NULL;
ALTER TABLE usuario_beneficios ADD COLUMN btg_qr_url TEXT NULL;
ALTER TABLE usuario_beneficios ADD COLUMN pix_stage VARCHAR(40) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN pix_etapa VARCHAR(40) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN pedido_codigo VARCHAR(64) NULL;
ALTER TABLE usuario_beneficios ADD COLUMN valor_cobrado DECIMAL(12,2) NULL;
