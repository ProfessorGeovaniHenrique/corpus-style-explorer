-- ========================================
-- HIERARQUIA COMPLETA: DS NATUREZA (47 categorias)
-- N1: 1 | N2: 5 | N3: 13 | N4: 28
-- ========================================

-- ==================== FASE 1: Atualizar N1 Existente ====================
UPDATE semantic_tagset
SET 
  nome = 'Natureza',
  descricao = 'Agrupa todos os termos relacionados ao mundo natural, seus componentes, fenômenos e seres vivos (excluindo o ser humano e suas criações diretas).',
  categoria_pai = NULL,
  nivel_profundidade = 1,
  status = 'ativo'
WHERE codigo = '01';

-- ==================== FASE 2: Atualizar N2 Existentes ====================
UPDATE semantic_tagset
SET 
  nome = 'Fauna (Vida Animal)',
  descricao = 'Termos relacionados a animais, suas características, comportamentos e classificações.',
  categoria_pai = '01',
  nivel_profundidade = 2,
  exemplos = ARRAY['cavalo', 'boi', 'onça', 'quero-quero', 'sabiá', 'rebanho', 'manada'],
  status = 'ativo'
WHERE codigo = '01.01';

UPDATE semantic_tagset
SET 
  nome = 'Flora (Vida Vegetal)',
  descricao = 'Termos relacionados a plantas, árvores, suas partes e formações vegetais.',
  categoria_pai = '01',
  nivel_profundidade = 2,
  exemplos = ARRAY['araucária', 'ipê', 'capim', 'flor', 'folha', 'floresta', 'mata'],
  status = 'ativo'
WHERE codigo = '01.02';

UPDATE semantic_tagset
SET 
  nome = 'Geografia e Relevo',
  descricao = 'Termos relacionados às formas da terra e aos corpos d''água.',
  categoria_pai = '01',
  nivel_profundidade = 2,
  exemplos = ARRAY['montanha', 'serra', 'coxilha', 'rio', 'arroio', 'lago', 'pampa'],
  status = 'ativo'
WHERE codigo = '01.03';

-- ==================== FASE 3: Inserir Novos N2 ====================
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.04', 'Fenômenos Naturais e Atmosféricos', 'Termos relacionados ao clima, tempo e eventos da natureza.', '01', 2, ARRAY['chuva', 'vento', 'tempestade', 'manhã', 'noite', 'verão', 'inverno'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.05', 'Elementos e Cosmos', 'Termos para os componentes fundamentais da natureza e o céu.', '01', 2, ARRAY['terra', 'fogo', 'pedra', 'sol', 'lua', 'estrela', 'céu'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- ==================== FASE 4: Inserir Todos os N3 ====================

-- Fauna N3 (3 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.01.01', 'Classificação de Animais', 'Categorias e tipos de animais.', '01.01', 3, ARRAY['mamífero', 'ave', 'réptil', 'peixe', 'inseto'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.01.02', 'Anatomia e Características Animais', 'Partes do corpo, pelagem e sons.', '01.01', 3, ARRAY['casco', 'chifre', 'crina', 'pelo', 'mugido', 'relincho'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.01.03', 'Comportamento e Coletivos', 'Ações, hábitos e agrupamentos de animais.', '01.01', 3, ARRAY['rebanho', 'manada', 'pastar', 'galopar', 'ninho', 'toca'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Flora N3 (3 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.02.01', 'Tipos de Plantas e Vegetação', 'Categorias de plantas, flores e frutos.', '01.02', 3, ARRAY['árvore', 'arbusto', 'erva', 'flor', 'fruto'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.02.02', 'Anatomia Vegetal', 'Partes que compõem uma planta.', '01.02', 3, ARRAY['raiz', 'caule', 'tronco', 'galho', 'folha', 'semente'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.02.03', 'Formações Vegetais (Biomas)', 'Grandes áreas de vegetação.', '01.02', 3, ARRAY['floresta', 'mata', 'campo', 'pampa', 'campina'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Geografia N3 (3 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.03.01', 'Formas de Relevo (Landforms)', 'Configurações da superfície terrestre.', '01.03', 3, ARRAY['montanha', 'morro', 'serra', 'coxilha', 'planície', 'várzea'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.03.02', 'Corpos d''Água (Hidrografia)', 'Termos para rios, lagos e outras formas de água.', '01.03', 3, ARRAY['rio', 'arroio', 'sanga', 'lago', 'lagoa', 'açude', 'mar'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.03.03', 'Medidas e Espaço', 'Conceitos de dimensão no ambiente natural.', '01.03', 3, ARRAY['distância', 'extensão', 'profundidade', 'altitude', 'légua'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Fenômenos N3 (2 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.04.01', 'Condições Climáticas e Tempo', 'Eventos e estados da atmosfera.', '01.04', 3, ARRAY['chuva', 'garoa', 'vento', 'tempestade', 'calor', 'frio'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.04.02', 'Ciclos Temporais Naturais', 'Divisões de tempo baseadas na natureza.', '01.04', 3, ARRAY['manhã', 'tarde', 'noite', 'madrugada', 'verão', 'inverno'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Elementos N3 (2 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.05.01', 'Elementos Fundamentais', 'Materiais básicos que compõem o ambiente.', '01.05', 3, ARRAY['terra', 'chão', 'solo', 'fogo', 'brasa', 'pedra', 'rocha'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.05.02', 'Corpos Celestes e Céu', 'Termos relacionados ao espaço sideral visível.', '01.05', 3, ARRAY['sol', 'lua', 'estrela', 'céu', 'horizonte'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- ==================== FASE 5: Inserir Todos os N4 (28 categorias) ====================

-- Classificação de Animais N4 (5 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.01.01.01', 'Mamíferos', 'Animais mamíferos.', '01.01.01', 4, ARRAY['cavalo', 'boi', 'onça', 'capivara', 'veado', 'cachorro', 'gato'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.01.01.02', 'Aves', 'Aves e pássaros.', '01.01.01', 4, ARRAY['quero-quero', 'sabiá', 'ema', 'seriema', 'joão-de-barro', 'andorinha'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.01.01.03', 'Répteis e Anfíbios', 'Répteis e anfíbios.', '01.01.01', 4, ARRAY['jacaré', 'cobra', 'sapo', 'lagarto', 'tartaruga'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.01.01.04', 'Peixes', 'Peixes e vida aquática.', '01.01.01', 4, ARRAY['dourado', 'lambari', 'traíra', 'bagre', 'pintado'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.01.01.05', 'Insetos e Artrópodes', 'Insetos e artrópodes.', '01.01.01', 4, ARRAY['formiga', 'borboleta', 'aranha', 'carrapato', 'abelha', 'grilo'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Anatomia Animal N4 (3 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.01.02.01', 'Partes do Corpo', 'Partes anatômicas de animais.', '01.01.02', 4, ARRAY['casco', 'chifre', 'cernelha', 'garupa', 'focinho', 'guampa', 'pata'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.01.02.02', 'Pelagem e Plumagem', 'Revestimento corporal de animais.', '01.01.02', 4, ARRAY['pelagem', 'crina', 'pelo', 'pena', 'plumagem', 'rosilho', 'zaino'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.01.02.03', 'Sons e Vocalizações', 'Sons emitidos por animais.', '01.01.02', 4, ARRAY['mugido', 'relincho', 'piado', 'zurro', 'uivo', 'latido', 'canto'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Comportamento Animal N4 (3 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.01.03.01', 'Coletivos', 'Agrupamentos de animais.', '01.01.03', 4, ARRAY['rebanho', 'manada', 'cardume', 'bando', 'tropilha', 'boiada'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.01.03.02', 'Ações e Hábitos', 'Comportamentos e atividades de animais.', '01.01.03', 4, ARRAY['pastar', 'hibernar', 'migrar', 'ruminar', 'galopar', 'voar'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.01.03.03', 'Habitats e Abrigos', 'Locais onde animais vivem.', '01.01.03', 4, ARRAY['ninho', 'toca', 'colmeia', 'formigueiro', 'covil'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Tipos de Plantas N4 (4 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.02.01.01', 'Árvores e Arbustos', 'Plantas lenhosas de grande porte.', '01.02.01', 4, ARRAY['araucária', 'ipê', 'pitangueira', 'aroeira', 'tarumã', 'cedrinho'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.02.01.02', 'Ervas e Gramíneas', 'Plantas herbáceas e gramíneas.', '01.02.01', 4, ARRAY['capim', 'samambaia', 'trevo', 'grama', 'ervacê', 'macela'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.02.01.03', 'Flores', 'Flores e plantas ornamentais.', '01.02.01', 4, ARRAY['orquídea', 'margarida', 'brinco-de-princesa', 'rosa', 'cravo'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.02.01.04', 'Frutos', 'Frutos e sementes comestíveis.', '01.02.01', 4, ARRAY['maçã', 'pinhão', 'butiá', 'bergamota', 'laranja', 'uva'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Anatomia Vegetal N4 (2 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.02.02.01', 'Estruturas Principais', 'Partes principais de uma planta.', '01.02.02', 4, ARRAY['raiz', 'caule', 'tronco', 'galho', 'copa'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.02.02.02', 'Partes Menores', 'Componentes detalhados de plantas.', '01.02.02', 4, ARRAY['folha', 'flor', 'semente', 'espinho', 'casca', 'broto'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Formações Vegetais N4 (2 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.02.03.01', 'Tipos de Mata', 'Formações florestais.', '01.02.03', 4, ARRAY['floresta', 'mata', 'capoeira', 'bosque', 'selva'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.02.03.02', 'Campos e Planícies', 'Formações campestres abertas.', '01.02.03', 4, ARRAY['campo', 'pampa', 'campina', 'pastagem', 'várzea'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Relevo N4 (3 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.03.01.01', 'Elevações', 'Formações elevadas do relevo.', '01.03.01', 4, ARRAY['montanha', 'morro', 'serra', 'coxilha', 'colina', 'cerro'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.03.01.02', 'Planícies e Vales', 'Áreas planas ou baixas do relevo.', '01.03.01', 4, ARRAY['planície', 'pampa', 'várzea', 'vale', 'baixada', 'planura'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.03.01.03', 'Acidentes Geográficos', 'Formações geográficas específicas.', '01.03.01', 4, ARRAY['cânion', 'penhasco', 'grota', 'desfiladeiro', 'ravina'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Corpos d'Água N4 (3 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.03.02.01', 'Água Corrente', 'Cursos d''água em movimento.', '01.03.02', 4, ARRAY['rio', 'riacho', 'arroio', 'sanga', 'córrego', 'ribeirão'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.03.02.02', 'Água Parada', 'Corpos d''água estagnados.', '01.03.02', 4, ARRAY['lago', 'lagoa', 'açude', 'banhado', 'pântano', 'charco'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.03.02.03', 'Oceano e Mar', 'Massas de água salgada.', '01.03.02', 4, ARRAY['mar', 'oceano', 'costa', 'litoral', 'praia'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Medidas N4 (1 categoria)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.03.03.01', 'Dimensões', 'Medidas espaciais.', '01.03.03', 4, ARRAY['distância', 'extensão', 'profundidade', 'altitude', 'légua', 'altura'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Condições Climáticas N4 (4 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.04.01.01', 'Precipitação', 'Fenômenos de queda de água.', '01.04.01', 4, ARRAY['chuva', 'garoa', 'geada', 'neve', 'sereno', 'orvalho', 'granizo'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.04.01.02', 'Ventos e Tempestades', 'Movimentos de ar e fenômenos severos.', '01.04.01', 4, ARRAY['vento', 'brisa', 'minuano', 'tempestade', 'vendaval', 'furacão'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.04.01.03', 'Temperatura e Sensação', 'Condições térmicas.', '01.04.01', 4, ARRAY['calor', 'frio', 'mormaço', 'aragem', 'quentura', 'friagem'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.04.01.04', 'Fenômenos Ópticos', 'Efeitos visuais atmosféricos.', '01.04.01', 4, ARRAY['arco-íris', 'aurora', 'relâmpago', 'raio', 'trovão'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Ciclos Temporais N4 (2 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.04.02.01', 'Partes do Dia', 'Divisões do dia.', '01.04.02', 4, ARRAY['manhã', 'tarde', 'noite', 'madrugada', 'crepúsculo', 'alvorada', 'meio-dia'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.04.02.02', 'Estações do Ano', 'Períodos sazonais.', '01.04.02', 4, ARRAY['verão', 'outono', 'inverno', 'primavera'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Elementos Fundamentais N4 (3 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.05.01.01', 'Terra e Solo', 'Materiais terrestres.', '01.05.01', 4, ARRAY['terra', 'chão', 'solo', 'poeira', 'barro', 'areia'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.05.01.02', 'Fogo', 'Elemento ígneo.', '01.05.01', 4, ARRAY['fogo', 'brasa', 'chama', 'labareda', 'incêndio', 'fogueira'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.05.01.03', 'Pedra e Rocha', 'Materiais pétreos.', '01.05.01', 4, ARRAY['pedra', 'rocha', 'seixo', 'cascalho', 'granito'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Corpos Celestes N4 (2 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status, aprovado_por, aprovado_em)
VALUES 
('01.05.02.01', 'Astros', 'Corpos celestes luminosos.', '01.05.02', 4, ARRAY['sol', 'lua', 'estrela', 'cometa', 'planeta'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW()),
('01.05.02.02', 'Espaço e Firmamento', 'O céu e o universo.', '01.05.02', 4, ARRAY['céu', 'firmamento', 'universo', 'horizonte', 'constelação'], 'ativo', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (codigo) DO NOTHING;

-- ==================== FASE 6: Recalcular Hierarquia ====================
SELECT calculate_tagset_hierarchy();

-- ==================== Verificação Final ====================
-- Contar total de registros inseridos/atualizados
DO $$
DECLARE
  total_natureza INTEGER;
  total_n1 INTEGER;
  total_n2 INTEGER;
  total_n3 INTEGER;
  total_n4 INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_natureza FROM semantic_tagset WHERE codigo LIKE '01%';
  SELECT COUNT(*) INTO total_n1 FROM semantic_tagset WHERE codigo LIKE '01' AND nivel_profundidade = 1;
  SELECT COUNT(*) INTO total_n2 FROM semantic_tagset WHERE codigo LIKE '01.__' AND nivel_profundidade = 2;
  SELECT COUNT(*) INTO total_n3 FROM semantic_tagset WHERE codigo LIKE '01.__.%' AND nivel_profundidade = 3;
  SELECT COUNT(*) INTO total_n4 FROM semantic_tagset WHERE codigo LIKE '01.__.__.%' AND nivel_profundidade = 4;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'HIERARQUIA DS NATUREZA COMPLETA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de categorias Natureza: %', total_natureza;
  RAISE NOTICE '  └─ N1 (Natureza): %', total_n1;
  RAISE NOTICE '  └─ N2 (Domínios principais): %', total_n2;
  RAISE NOTICE '  └─ N3 (Subdomínios): %', total_n3;
  RAISE NOTICE '  └─ N4 (Categorias específicas): %', total_n4;
  RAISE NOTICE '========================================';
END $$;