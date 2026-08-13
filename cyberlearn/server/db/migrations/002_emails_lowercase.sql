-- 002: normalização de emails para minúsculas + unicidade.
-- O servidor passou a normalizar emails no registo/login; esta migração
-- alinha os dados existentes.
--
-- PASSO 1 (verificação manual): se esta query devolver linhas, existem contas
-- duplicadas que diferem apenas em maiúsculas — resolver à mão antes do passo 2.
SELECT LOWER(email) AS email_normalizado, COUNT(*)
FROM utilizadores
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- PASSO 2: normalizar e garantir unicidade daqui em diante.
UPDATE utilizadores SET email = LOWER(TRIM(email));
CREATE UNIQUE INDEX IF NOT EXISTS utilizadores_email_unico ON utilizadores (email);
