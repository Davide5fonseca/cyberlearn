-- 001: contador de tentativas do código 2FA.
-- Ao fim de 5 falhas o servidor anula o código e obriga a novo login.
-- Aplicar com: psql "$DATABASE_URL" -f 001_2fa_tentativas.sql

ALTER TABLE utilizadores
    ADD COLUMN IF NOT EXISTS codigo_2fa_tentativas INTEGER NOT NULL DEFAULT 0;

-- Verificação: deve devolver a coluna com default 0
-- SELECT column_name, column_default FROM information_schema.columns
--  WHERE table_name = 'utilizadores' AND column_name = 'codigo_2fa_tentativas';
