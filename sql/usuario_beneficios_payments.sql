-- Rode no MySQL do projeto.
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
  btg_authorization_id VARCHAR(120) NULL,
  btg_contract VARCHAR(40) NULL,
  btg_tx_id VARCHAR(80) NULL,
  btg_emv TEXT NULL,
  btg_qr_url TEXT NULL,
  pix_stage VARCHAR(40) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ub_usuario_beneficio (usuario_id, beneficio_id),
  KEY idx_ub_stripe_sub (stripe_subscription_id),
  KEY idx_ub_btg_auth (btg_authorization_id),
  KEY idx_ub_btg_tx (btg_tx_id)
);

-- Colunas extras caso a tabela já exista sem elas:
-- ALTER TABLE usuario_beneficios ADD COLUMN metodo_pagamento VARCHAR(40) NULL;
-- ALTER TABLE usuario_beneficios ADD COLUMN status_assinatura VARCHAR(40) NOT NULL DEFAULT 'pendente';
-- ALTER TABLE usuario_beneficios ADD COLUMN stripe_customer_id VARCHAR(120) NULL;
-- ALTER TABLE usuario_beneficios ADD COLUMN stripe_subscription_id VARCHAR(120) NULL;
-- ALTER TABLE usuario_beneficios ADD COLUMN stripe_payment_method_id VARCHAR(120) NULL;
-- ALTER TABLE usuario_beneficios ADD COLUMN btg_authorization_id VARCHAR(120) NULL;
-- ALTER TABLE usuario_beneficios ADD COLUMN btg_contract VARCHAR(40) NULL;
-- ALTER TABLE usuario_beneficios ADD COLUMN btg_tx_id VARCHAR(80) NULL;
-- ALTER TABLE usuario_beneficios ADD COLUMN btg_emv TEXT NULL;
-- ALTER TABLE usuario_beneficios ADD COLUMN btg_qr_url TEXT NULL;
-- ALTER TABLE usuario_beneficios ADD COLUMN pix_stage VARCHAR(40) NULL;
