-- Resultado da consulta de processos judiciais (Judit) por motorista.
-- Rodar uma vez no banco principal (DB_NAME). A aplicação também cria
-- a tabela automaticamente (ensureLawsuitSchema).

CREATE TABLE IF NOT EXISTS driver_lawsuit_checks (
  id             CHAR(36)     NOT NULL,
  driver_id      CHAR(36)     NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'nao_iniciado',
  total_lawsuits INT          NOT NULL DEFAULT 0,
  result         LONGTEXT     NULL,
  checked_at     TIMESTAMP    NULL,
  created_at     TIMESTAMP    NULL,
  updated_at     TIMESTAMP    NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_driver_lawsuit_checks_driver (driver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
