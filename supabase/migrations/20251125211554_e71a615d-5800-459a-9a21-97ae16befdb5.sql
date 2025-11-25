-- ============================================================================
-- MIGRAÇÃO: Hierarquia Completa DS "Sentimentos" (SE)
-- Estrutura: 1 N1 + 6 N2 + 19 N3 + 25 N4 = 51 categorias
-- ============================================================================

-- FASE 1: Limpeza Recursiva (deletar filhos primeiro)

-- Deletar N4s relacionados a sentimentos (código 05.x.x.x ou SE.x.x.x)
DELETE FROM semantic_tagset 
WHERE (categoria_pai LIKE '05.%.%' OR categoria_pai LIKE 'SE.%.%')
  AND nivel_profundidade = 4;

-- Deletar N3s relacionados a sentimentos (código 05.x.x ou SE.x.x)
DELETE FROM semantic_tagset 
WHERE (categoria_pai LIKE '05.%' OR categoria_pai LIKE 'SE.%')
  AND categoria_pai NOT LIKE '%.%.%'
  AND nivel_profundidade = 3;

-- Deletar N2s relacionados a sentimentos (código 05.x ou SE.x)
DELETE FROM semantic_tagset 
WHERE (categoria_pai = '05' OR categoria_pai = 'SE')
  AND nivel_profundidade = 2;

-- Deletar N1 antigo (código numérico 05) se existir
DELETE FROM semantic_tagset 
WHERE codigo = '05';

-- FASE 2: Atualizar ou Inserir N1 - Sentimentos
-- Usar UPSERT para atualizar se já existe 'SE'
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai) 
VALUES ('SE', 'Sentimentos', 'Agrupa termos que descrevem estados emocionais, afetivos e de humor do ser humano, abrangendo desde reações primárias e instintivas até sentimentos sociais e cognitivos complexos.', 'ativo', 1, NULL, NULL)
ON CONFLICT (codigo) 
DO UPDATE SET 
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  status = EXCLUDED.status,
  nivel_profundidade = EXCLUDED.nivel_profundidade,
  categoria_pai = EXCLUDED.categoria_pai,
  tagset_pai = EXCLUDED.tagset_pai;

-- FASE 3: Inserir N2 - 6 categorias principais
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.01', 'Alegria e Bem-Estar', 'Sentimentos positivos relacionados à satisfação, prazer e contentamento.', 'ativo', 2, 'SE', 'SE', ARRAY['alegria', 'felicidade', 'paz', 'contentamento']),
('SE.02', 'Tristeza e Desamparo', 'Sentimentos negativos associados à perda, dor, desapontamento e solidão.', 'ativo', 2, 'SE', 'SE', ARRAY['tristeza', 'saudade', 'melancolia', 'sofrimento']),
('SE.03', 'Raiva e Hostilidade', 'Sentimentos de antagonismo, irritação e agressividade em resposta a uma ofensa, ameaça ou frustração.', 'ativo', 2, 'SE', 'SE', ARRAY['raiva', 'irritação', 'ódio', 'ressentimento']),
('SE.04', 'Medo e Ansiedade', 'Sentimentos de apreensão e agitação em resposta a uma ameaça percebida, seja ela real ou imaginária.', 'ativo', 2, 'SE', 'SE', ARRAY['medo', 'pavor', 'ansiedade', 'insegurança']),
('SE.05', 'Amor e Afeição', 'Sentimentos positivos direcionados a outros seres, relacionados à conexão, cuidado e apreciação.', 'ativo', 2, 'SE', 'SE', ARRAY['amor', 'carinho', 'paixão', 'empatia', 'admiração']),
('SE.06', 'Estados Cognitivos e Sociais', 'Sentimentos complexos que emergem da autoavaliação, da interação social e da reação ao inesperado.', 'ativo', 2, 'SE', 'SE', ARRAY['confiança', 'vergonha', 'surpresa', 'desprezo']);

-- FASE 4: Inserir N3 - 19 categorias

-- SE.01 - Alegria e Bem-Estar (3 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai) VALUES
('SE.01.01', 'Euforia e Excitação', 'Estados de alegria intensa, de alta energia e celebração.', 'ativo', 3, 'SE.01', 'SE.01'),
('SE.01.02', 'Contentamento e Serenidade', 'Estados de bem-estar calmo, paz interior e satisfação tranquila.', 'ativo', 3, 'SE.01', 'SE.01'),
('SE.01.03', 'Diversão e Prazer', 'Sentimentos ligados ao entretenimento, humor e deleite.', 'ativo', 3, 'SE.01', 'SE.01');

-- SE.02 - Tristeza e Desamparo (3 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai) VALUES
('SE.02.01', 'Melancolia e Desânimo', 'Estados de tristeza de baixa intensidade, falta de energia e motivação.', 'ativo', 3, 'SE.02', 'SE.02'),
('SE.02.02', 'Sofrimento e Dor Emocional', 'Estados de tristeza profunda, aguda e muitas vezes avassaladora.', 'ativo', 3, 'SE.02', 'SE.02'),
('SE.02.03', 'Nostalgia e Saudade', 'Tristeza relacionada à ausência ou à lembrança do passado.', 'ativo', 3, 'SE.02', 'SE.02');

-- SE.03 - Raiva e Hostilidade (3 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai) VALUES
('SE.03.01', 'Irritação e Frustração', 'Estados de raiva de baixa a média intensidade, impaciência e aborrecimento.', 'ativo', 3, 'SE.03', 'SE.03'),
('SE.03.02', 'Fúria e Ódio', 'Estados de raiva extrema, intensa e muitas vezes incontrolável.', 'ativo', 3, 'SE.03', 'SE.03'),
('SE.03.03', 'Ressentimento e Mágoa', 'Raiva internalizada e duradoura, relacionada a uma ofensa passada.', 'ativo', 3, 'SE.03', 'SE.03');

-- SE.04 - Medo e Ansiedade (3 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai) VALUES
('SE.04.01', 'Pavor e Terror', 'Medo agudo e intenso diante de um perigo imediato e concreto.', 'ativo', 3, 'SE.04', 'SE.04'),
('SE.04.02', 'Preocupação e Ansiedade', 'Medo difuso e persistente, geralmente focado em ameaças futuras ou incertas.', 'ativo', 3, 'SE.04', 'SE.04'),
('SE.04.03', 'Insegurança e Receio', 'Medo de baixa intensidade, hesitação diante do desconhecido ou da possibilidade de falha.', 'ativo', 3, 'SE.04', 'SE.04');

-- SE.05 - Amor e Afeição (4 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai) VALUES
('SE.05.01', 'Carinho e Ternura', 'Afeto gentil, cuidado e apreço por familiares e amigos.', 'ativo', 3, 'SE.05', 'SE.05'),
('SE.05.02', 'Paixão e Desejo', 'Amor romântico e intenso, atração e desejo.', 'ativo', 3, 'SE.05', 'SE.05'),
('SE.05.03', 'Empatia e Compaixão', 'Sentimentos de conexão com o estado emocional de outra pessoa, especialmente o sofrimento.', 'ativo', 3, 'SE.05', 'SE.05'),
('SE.05.04', 'Admiração e Gratidão', 'Sentimentos positivos em reconhecimento às qualidades ou ações de alguém.', 'ativo', 3, 'SE.05', 'SE.05');

-- SE.06 - Estados Cognitivos e Sociais (4 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai) VALUES
('SE.06.01', 'Confiança e Otimismo', 'Sentimentos relacionados à crença positiva em si mesmo, nos outros ou no futuro.', 'ativo', 3, 'SE.06', 'SE.06'),
('SE.06.02', 'Vergonha e Culpa', 'Sentimentos negativos decorrentes da percepção de uma falha pessoal ou transgressão social.', 'ativo', 3, 'SE.06', 'SE.06'),
('SE.06.03', 'Surpresa e Curiosidade', 'Reações a eventos inesperados ou ao desconhecido.', 'ativo', 3, 'SE.06', 'SE.06'),
('SE.06.04', 'Desprezo e Aversão', 'Sentimentos de repulsa ou superioridade moral em relação a algo ou alguém.', 'ativo', 3, 'SE.06', 'SE.06');

-- FASE 5: Inserir N4 - 25 categorias (subcategorias específicas com exemplos lexicais)

-- SE.01.01 - Euforia e Excitação (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.01.01.01', 'Felicidade e Entusiasmo', 'Expressões de alegria intensa e energia positiva.', 'ativo', 4, 'SE.01.01', 'SE.01.01', ARRAY['alegria', 'felicidade', 'euforia', 'júbilo', 'entusiasmo']);

-- SE.01.02 - Contentamento e Serenidade (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.01.02.01', 'Paz e Tranquilidade', 'Estados de calma profunda e ausência de perturbação.', 'ativo', 4, 'SE.01.02', 'SE.01.02', ARRAY['paz', 'serenidade', 'calma', 'tranquilidade', 'sossego']),
('SE.01.02.02', 'Satisfação e Realização', 'Sentimentos de contentamento e orgulho em relação a conquistas.', 'ativo', 4, 'SE.01.02', 'SE.01.02', ARRAY['satisfação', 'contentamento', 'orgulho', 'realização']);

-- SE.01.03 - Diversão e Prazer (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.01.03.01', 'Humor e Riso', 'Expressões de alegria lúdica e diversão.', 'ativo', 4, 'SE.01.03', 'SE.01.03', ARRAY['graça', 'humor', 'diversão', 'riso']);

-- SE.02.01 - Melancolia e Desânimo (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.02.01.01', 'Tristeza e Abatimento', 'Estados de tristeza suave e falta de ânimo.', 'ativo', 4, 'SE.02.01', 'SE.02.01', ARRAY['tristeza', 'desânimo', 'melancolia', 'abatimento', 'desalento']);

-- SE.02.02 - Sofrimento e Dor Emocional (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.02.02.01', 'Angústia e Desespero', 'Sofrimento intenso e avassalador.', 'ativo', 4, 'SE.02.02', 'SE.02.02', ARRAY['dor', 'sofrimento', 'angústia', 'desespero', 'amargura']);

-- SE.02.03 - Nostalgia e Saudade (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.02.03.01', 'Saudade e Falta', 'Sentimentos de ausência e lembrança do passado.', 'ativo', 4, 'SE.02.03', 'SE.02.03', ARRAY['saudade', 'nostalgia', 'falta', 'ausência']);

-- SE.03.01 - Irritação e Frustração (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.03.01.01', 'Aborrecimento e Impaciência', 'Raiva leve e impaciência.', 'ativo', 4, 'SE.03.01', 'SE.03.01', ARRAY['irritação', 'chateação', 'aborrecimento', 'impaciência']);

-- SE.03.02 - Fúria e Ódio (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.03.02.01', 'Ira e Cólera', 'Raiva extrema e incontrolável.', 'ativo', 4, 'SE.03.02', 'SE.03.02', ARRAY['raiva', 'fúria', 'ira', 'ódio', 'cólera', 'indignação']);

-- SE.03.03 - Ressentimento e Mágoa (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.03.03.01', 'Rancor e Amargura', 'Raiva duradoura e internalizada.', 'ativo', 4, 'SE.03.03', 'SE.03.03', ARRAY['ressentimento', 'mágoa', 'rancor', 'despeito']);

-- SE.04.01 - Pavor e Terror (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.04.01.01', 'Pânico e Susto', 'Medo intenso e agudo.', 'ativo', 4, 'SE.04.01', 'SE.04.01', ARRAY['medo', 'pavor', 'terror', 'pânico', 'susto', 'horror']);

-- SE.04.02 - Preocupação e Ansiedade (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.04.02.01', 'Apreensão e Nervosismo', 'Medo difuso e persistente.', 'ativo', 4, 'SE.04.02', 'SE.04.02', ARRAY['ansiedade', 'preocupação', 'apreensão', 'nervosismo', 'aflição']);

-- SE.04.03 - Insegurança e Receio (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.04.03.01', 'Hesitação e Cautela', 'Medo leve e hesitação.', 'ativo', 4, 'SE.04.03', 'SE.04.03', ARRAY['receio', 'insegurança', 'cautela', 'timidez']);

-- SE.05.01 - Carinho e Ternura (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.05.01.01', 'Afeto e Cuidado', 'Afeto gentil e cuidadoso.', 'ativo', 4, 'SE.05.01', 'SE.05.01', ARRAY['carinho', 'afeto', 'ternura', 'amizade', 'apreço']);

-- SE.05.02 - Paixão e Desejo (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.05.02.01', 'Amor Romântico', 'Amor intenso e romântico.', 'ativo', 4, 'SE.05.02', 'SE.05.02', ARRAY['amor', 'paixão', 'desejo', 'atração', 'adoração']);

-- SE.05.03 - Empatia e Compaixão (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.05.03.01', 'Solidariedade e Piedade', 'Conexão empática com o sofrimento alheio.', 'ativo', 4, 'SE.05.03', 'SE.05.03', ARRAY['empatia', 'compaixão', 'piedade', 'solidariedade']);

-- SE.05.04 - Admiração e Gratidão (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.05.04.01', 'Respeito e Apreço', 'Sentimentos de reconhecimento positivo.', 'ativo', 4, 'SE.05.04', 'SE.05.04', ARRAY['admiração', 'respeito', 'gratidão', 'apreço', 'reverência']);

-- SE.06.01 - Confiança e Otimismo (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.06.01.01', 'Esperança e Fé', 'Crença positiva no futuro.', 'ativo', 4, 'SE.06.01', 'SE.06.01', ARRAY['confiança', 'fé', 'esperança', 'otimismo', 'segurança']);

-- SE.06.02 - Vergonha e Culpa (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.06.02.01', 'Remorso e Constrangimento', 'Sentimentos de falha pessoal e transgressão.', 'ativo', 4, 'SE.06.02', 'SE.06.02', ARRAY['vergonha', 'culpa', 'remorso', 'constrangimento', 'humilhação']);

-- SE.06.03 - Surpresa e Curiosidade (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.06.03.01', 'Espanto e Assombro', 'Reação a eventos inesperados.', 'ativo', 4, 'SE.06.03', 'SE.06.03', ARRAY['surpresa', 'espanto', 'assombro', 'choque']),
('SE.06.03.02', 'Interesse e Fascínio', 'Curiosidade e atração pelo desconhecido.', 'ativo', 4, 'SE.06.03', 'SE.06.03', ARRAY['curiosidade', 'interesse', 'fascínio']);

-- SE.06.04 - Desprezo e Aversão (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, status, nivel_profundidade, categoria_pai, tagset_pai, exemplos) VALUES
('SE.06.04.01', 'Nojo e Repulsa', 'Sentimentos de aversão física ou moral.', 'ativo', 4, 'SE.06.04', 'SE.06.04', ARRAY['nojo', 'aversão', 'repulsa', 'asco']),
('SE.06.04.02', 'Desdém e Desprezo', 'Sentimentos de superioridade e desdém.', 'ativo', 4, 'SE.06.04', 'SE.06.04', ARRAY['desprezo', 'desdém', 'escárnio']);

-- FASE 6: Recalcular hierarquia para atualizar campos derivados
SELECT calculate_tagset_hierarchy();

-- Verificar resultado final
SELECT 
  nivel_profundidade,
  COUNT(*) as total,
  string_agg(codigo, ', ' ORDER BY codigo) as codigos
FROM semantic_tagset
WHERE codigo LIKE 'SE%' OR codigo LIKE 'SE.%'
GROUP BY nivel_profundidade
ORDER BY nivel_profundidade;