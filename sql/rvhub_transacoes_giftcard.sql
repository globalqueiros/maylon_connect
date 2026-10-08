-- Habilita gift cards (recarga de PIN da RVHub) no histórico.
-- Rodar uma vez no banco principal (DB_NAME), depois de sql/rvhub_transacoes.sql.

ALTER TABLE rvhub_transacoes
  MODIFY COLUMN tipo ENUM('recarga', 'conta', 'giftcard') NOT NULL;

ALTER TABLE rvhub_transacoes
  ADD COLUMN pin VARCHAR(64) NULL AFTER nsu;
