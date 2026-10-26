-- Motorista feminina / passageira com preferência de pareamento.
-- As rotas criam estas tabelas sozinhas na primeira chamada (CREATE TABLE IF
-- NOT EXISTS); este script serve para aplicar a mudança de forma controlada.

-- Gênero confirmado de cada usuário. "didit" vem do documento verificado e
-- vale mais que o cadastro (users.gender), que é lido direto quando não há
-- registro aqui.
CREATE TABLE IF NOT EXISTS usuario_genero (
  user_id VARCHAR(64) NOT NULL,
  genero ENUM('feminino', 'masculino', 'outro') NOT NULL,
  fonte VARCHAR(20) NOT NULL,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
);

-- motorista_feminina: padrão da passageira (pode ser trocado em cada corrida).
-- somente_passageiras: motorista que só quer atender passageiras.
CREATE TABLE IF NOT EXISTS preferencias_pareamento (
  user_id VARCHAR(64) NOT NULL,
  motorista_feminina TINYINT(1) NOT NULL DEFAULT 0,
  somente_passageiras TINYINT(1) NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
);
