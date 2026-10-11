-- Histórico de recargas de celular e pagamentos de contas feitos pela Asaas.
-- Rodar uma vez no banco principal (DB_NAME).
-- usuario_id é VARCHAR(36) para aceitar id numérico ou UUID.

CREATE TABLE IF NOT EXISTS asaas_transacoes (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id       VARCHAR(36)  NOT NULL,
  tipo             ENUM('recarga', 'conta') NOT NULL,
  asaas_id         VARCHAR(64)  NULL,
  status           VARCHAR(40)  NOT NULL,
  valor            DECIMAL(10,2) NOT NULL,
  telefone         VARCHAR(11)  NULL,
  operadora        VARCHAR(40)  NULL,
  linha_digitavel  VARCHAR(60)  NULL,
  beneficiario     VARCHAR(150) NULL,
  data_agendamento DATE         NULL,
  erro             VARCHAR(255) NULL,
  criado_em        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asaas_id (asaas_id),
  KEY idx_usuario_data (usuario_id, criado_em),
  KEY idx_conta (usuario_id, linha_digitavel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
