-- 004: aprovação de professores pelo admin.
-- Novos registos de professor nascem com ativo = false até aprovação.
-- Esta migração garante que a coluna existe, que os utilizadores atuais
-- continuam ativos e que a coluna deixa de aceitar NULL.

ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS ativo BOOLEAN;

UPDATE utilizadores SET ativo = true WHERE ativo IS NULL;

ALTER TABLE utilizadores
    ALTER COLUMN ativo SET DEFAULT true,
    ALTER COLUMN ativo SET NOT NULL;

-- Verificação:
-- SELECT ativo, COUNT(*) FROM utilizadores GROUP BY ativo;  -- todos true após aplicar
