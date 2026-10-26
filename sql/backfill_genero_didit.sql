-- Preenche usuario_genero com o gênero do documento das pessoas que JÁ foram
-- verificadas no Didit antes desta atualização. O webhook guarda a decisão
-- completa em driver_identity_verifications.attempt_details.
--
-- Só entra quem foi aprovado E teve o documento conferido com o cadastro
-- (identity_match.ok), a mesma regra do webhook novo.
--
-- 1) Rode primeiro a PRÉVIA e confira se os gêneros fazem sentido.
-- 2) Só então rode o INSERT.
-- Execute depois de criar as tabelas (ver pareamento_motorista_feminina.sql).

-- 1) PRÉVIA (não altera nada)
SELECT
  driver_id AS user_id,
  JSON_UNQUOTE(JSON_EXTRACT(attempt_details, '$.decision.id_verifications[0].gender')) AS genero_no_documento,
  JSON_EXTRACT(attempt_details, '$.identity_match.ok') AS documento_confere
FROM driver_identity_verifications
WHERE current_status = 'Approved'
LIMIT 50;

-- 2) PREENCHIMENTO
INSERT INTO usuario_genero (user_id, genero, fonte)
SELECT user_id, genero, 'didit'
FROM (
  SELECT
    driver_id AS user_id,
    CASE UPPER(JSON_UNQUOTE(JSON_EXTRACT(attempt_details, '$.decision.id_verifications[0].gender')))
      WHEN 'F' THEN 'feminino'
      WHEN 'FEMALE' THEN 'feminino'
      WHEN 'M' THEN 'masculino'
      WHEN 'MALE' THEN 'masculino'
      ELSE NULL
    END AS genero
  FROM driver_identity_verifications
  WHERE current_status = 'Approved'
    AND JSON_EXTRACT(attempt_details, '$.identity_match.ok') = TRUE
) AS historico
WHERE genero IS NOT NULL
ON DUPLICATE KEY UPDATE genero = VALUES(genero), fonte = VALUES(fonte);
