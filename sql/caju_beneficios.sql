-- Prepara a tabela caju_beneficios para guardar o pedido do cartao Caju
-- em campos separados, no formato que a integracao com a API vai usar.
--
-- A tabela esta vazia, entao a alteracao nao afeta nada em producao.
--
-- usuario_id estava como int e o id dos motoristas e UUID, por isso nenhum
-- pedido conseguia ser gravado.

ALTER TABLE `caju_beneficios`
  MODIFY `usuario_id` CHAR(36) NOT NULL,
  ADD COLUMN `pedido_codigo` VARCHAR(64) DEFAULT NULL AFTER `beneficio_id`,
  ADD COLUMN `nome` VARCHAR(255) DEFAULT NULL AFTER `pedido_codigo`,
  ADD COLUMN `email` VARCHAR(255) DEFAULT NULL AFTER `nome`,
  ADD COLUMN `cpf` VARCHAR(11) DEFAULT NULL AFTER `email`,
  ADD COLUMN `telefone` VARCHAR(20) DEFAULT NULL AFTER `cpf`,
  ADD COLUMN `status_cartao` VARCHAR(40) DEFAULT 'aguardando_envio' AFTER `estado`;
