-- 003: quizzes passam a ser identificados por id de grupo em vez do título.
-- Corrige o risco de aprovar/apagar quizzes homónimos de outros professores
-- e prepara a correção no servidor (Fase 4).
-- ⚠️ Aplicar ANTES de fazer deploy do código da Fase 4.

BEGIN;

-- 1. Grupo de quiz: uma avaliação (título + curso) com N perguntas.
CREATE TABLE IF NOT EXISTS quiz_grupos (
    id           SERIAL PRIMARY KEY,
    titulo       VARCHAR(255) NOT NULL,
    curso_id     INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
    aprovado     BOOLEAN NOT NULL DEFAULT false,
    data_criacao TIMESTAMP DEFAULT NOW(),
    UNIQUE (titulo, curso_id)
);

-- 2. Um grupo por cada (titulo, curso) existente; aprovado só se todas as perguntas o forem.
INSERT INTO quiz_grupos (titulo, curso_id, aprovado)
SELECT titulo, curso_id, BOOL_AND(aprovado)
FROM quizzes
GROUP BY titulo, curso_id
ON CONFLICT DO NOTHING;

-- 3. Ligar cada pergunta ao seu grupo.
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS grupo_id INTEGER REFERENCES quiz_grupos(id) ON DELETE CASCADE;

UPDATE quizzes q
SET grupo_id = g.id
FROM quiz_grupos g
WHERE q.grupo_id IS NULL
  AND g.titulo = q.titulo
  AND (g.curso_id = q.curso_id OR (g.curso_id IS NULL AND q.curso_id IS NULL));

ALTER TABLE quizzes ALTER COLUMN grupo_id SET NOT NULL;

-- 4. Backfill (best-effort) do histórico de tentativas por título.
--    Tentativas cujo título já não existe ficam com quiz_grupo_id NULL —
--    as estatísticas agregam por utilizador_id, nada se perde.
ALTER TABLE tentativas_quizzes ADD COLUMN IF NOT EXISTS quiz_grupo_id INTEGER REFERENCES quiz_grupos(id) ON DELETE SET NULL;

UPDATE tentativas_quizzes t
SET quiz_grupo_id = g.id
FROM quiz_grupos g
WHERE t.quiz_grupo_id IS NULL AND g.titulo = t.quiz_titulo;

COMMIT;

-- Verificação:
-- SELECT COUNT(*) FROM quizzes WHERE grupo_id IS NULL;                     -- deve ser 0
-- SELECT COUNT(*) FROM tentativas_quizzes WHERE quiz_grupo_id IS NULL;    -- tentativas órfãs (aceitável)
