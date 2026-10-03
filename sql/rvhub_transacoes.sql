-- Histórico de recargas de celular e pagamentos de contas feitos pela RVHub.
-- Rodar uma vez no banco principal (DB_NAME).
-- usuario_id é VARCHAR(36) para aceitar id numérico ou UUID.

CREATE TABLE IF NOT EXISTS rvhub_transacoes (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id         VARCHAR(36)  NOT NULL,
  tipo               ENUM('recarga', 'conta') NOT NULL,
  rvhub_id           VARCHAR(64)  NULL,
  status             VARCHAR(40)  NOT NULL,
  status_reason      VARCHAR(80)  NULL,
  valor              DECIMAL(10,2) NOT NULL,
  telefone           VARCHAR(11)  NULL,
  operadora          VARCHAR(40)  NULL,
  product_id         VARCHAR(40)  NULL,
  linha_digitavel    VARCHAR(60)  NULL,
  barcode            VARCHAR(60)  NULL,
  beneficiario       VARCHAR(180) NULL,
  payer_name         VARCHAR(180) NULL,
  payer_document     VARCHAR(20)  NULL,
  authorization_code VARCHAR(40)  NULL,
  nsu                VARCHAR(20)  NULL,
  erro               VARCHAR(255) NULL,
  criado_em          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rvhub_id (rvhub_id),
  KEY idx_usuario_data (usuario_id, criado_em),
  KEY idx_conta (usuario_id, linha_digitavel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
