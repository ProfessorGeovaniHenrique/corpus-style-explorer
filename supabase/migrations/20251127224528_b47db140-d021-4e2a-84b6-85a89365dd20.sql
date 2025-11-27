-- ================================================
-- MIGRAÇÃO: Domínio Semântico "Ações e Processos" (AC)
-- Data: 2025-01-27
-- ================================================
-- Atualiza N1 existente "AC" e cria hierarquia completa:
-- - 5 N2 (superdomínios)
-- - 12 N3 (subcategorias)
-- - 23 N4 (categorias granulares)
-- Total: 40 novos tagsets + 1 atualização

-- ====================
-- FASE 1: Atualizar N1
-- ====================
UPDATE semantic_tagset
SET 
  nome = 'Ações e Processos',
  descricao = 'Agrupa verbos que descrevem ações físicas, voluntárias e observáveis, onde um sujeito (humano ou animal) interage diretamente com o mundo físico ou com outros seres. Este domínio foca no ato físico em si, separando-o de seu contexto social (como em "Trabalho" ou "Lazer"), de sua função fisiológica involuntária (como em "Ser Humano") ou de seus resultados abstratos (como em "Cultura e Conhecimento"). É, essencialmente, o domínio do "fazer" e do "agir" no mundo material.',
  status = 'ativo',
  aprovado_em = NOW(),
  aprovado_por = '00000000-0000-0000-0000-000000000000'
WHERE codigo = 'AC';

-- ====================
-- FASE 2: Inserir 5 N2
-- ====================

-- N2.1: Movimento e Deslocamento
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES (
  'AC.MD',
  'Movimento e Deslocamento',
  'Verbos que descrevem o movimento do próprio sujeito no espaço ou a mudança de sua postura.',
  'AC',
  'AC',
  2,
  'ativo',
  NOW(),
  '00000000-0000-0000-0000-000000000000',
  ARRAY['andar', 'correr', 'pular', 'sentar', 'levantar', 'virar']
);

-- N2.2: Manipulação e Interação com Objetos
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES (
  'AC.MI',
  'Manipulação e Interação com Objetos',
  'Verbos que descrevem como um sujeito interage fisicamente com objetos ou outras entidades.',
  'AC',
  'AC',
  2,
  'ativo',
  NOW(),
  '00000000-0000-0000-0000-000000000000',
  ARRAY['pegar', 'segurar', 'empurrar', 'jogar', 'amarrar', 'abrir']
);

-- N2.3: Transformação (Criação e Destruição)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES (
  'AC.TR',
  'Transformação (Criação e Destruição)',
  'Verbos que descrevem a alteração da forma, estrutura ou estado de um objeto ou matéria.',
  'AC',
  'AC',
  2,
  'ativo',
  NOW(),
  '00000000-0000-0000-0000-000000000000',
  ARRAY['construir', 'quebrar', 'cortar', 'limpar', 'escrever', 'desenhar']
);

-- N2.4: Percepção Sensorial Ativa
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES (
  'AC.PS',
  'Percepção Sensorial Ativa',
  'Verbos que descrevem o ato voluntário de usar os sentidos para captar informação do ambiente.',
  'AC',
  'AC',
  2,
  'ativo',
  NOW(),
  '00000000-0000-0000-0000-000000000000',
  ARRAY['olhar', 'ver', 'escutar', 'ouvir', 'cheirar', 'provar']
);

-- N2.5: Expressão e Comunicação Física
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES (
  'AC.EC',
  'Expressão e Comunicação Física',
  'Verbos que descrevem os atos físicos usados para comunicar ou expressar algo.',
  'AC',
  'AC',
  2,
  'ativo',
  NOW(),
  '00000000-0000-0000-0000-000000000000',
  ARRAY['falar', 'dizer', 'cantar', 'gritar', 'acenar', 'abraçar']
);

-- ====================
-- FASE 3: Inserir 12 N3
-- ====================

-- Sob AC.MD (Movimento e Deslocamento)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.MD.LOC', 'Locomoção', 'Ações que movem o corpo de um ponto a outro.', 'AC.MD', 'AC.MD', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['andar', 'correr', 'pular', 'nadar']),
  ('AC.MD.POST', 'Mudança de Postura e Posição', 'Ações que alteram a posição do corpo sem deslocamento.', 'AC.MD', 'AC.MD', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['sentar', 'levantar', 'deitar', 'virar']);

-- Sob AC.MI (Manipulação e Interação)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.MI.POS', 'Ações de Posse e Contato', 'Iniciar, manter ou cessar contato com objetos.', 'AC.MI', 'AC.MI', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['pegar', 'segurar', 'soltar', 'tocar']),
  ('AC.MI.FOR', 'Ações de Força Aplicada', 'Aplicar força para mover ou alterar objetos.', 'AC.MI', 'AC.MI', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['empurrar', 'puxar', 'jogar', 'bater']),
  ('AC.MI.JUN', 'Ações de Junção e Separação', 'Unir, separar, abrir ou fechar objetos.', 'AC.MI', 'AC.MI', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['amarrar', 'abrir', 'fechar', 'colar']);

-- Sob AC.TR (Transformação)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.TR.CRI', 'Ações de Criação e Construção', 'Criar algo novo ou nova configuração.', 'AC.TR', 'AC.TR', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['construir', 'montar', 'escrever', 'desenhar']),
  ('AC.TR.DES', 'Ações de Destruição e Desmontagem', 'Desfazer, quebrar ou separar.', 'AC.TR', 'AC.TR', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['quebrar', 'demolir', 'cortar', 'limpar']);

-- Sob AC.PS (Percepção Sensorial)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.PS.VIS', 'Percepção Visual Ativa', 'Uso ativo da visão.', 'AC.PS', 'AC.PS', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['olhar', 'ver', 'observar', 'espiar']),
  ('AC.PS.AUD', 'Percepção Auditiva Ativa', 'Uso ativo da audição.', 'AC.PS', 'AC.PS', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['escutar', 'ouvir', 'auscultar']),
  ('AC.PS.OUT', 'Percepção Tátil, Olfativa e Gustativa', 'Uso ativo de outros sentidos.', 'AC.PS', 'AC.PS', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['cheirar', 'provar', 'apalpar']);

-- Sob AC.EC (Expressão e Comunicação)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.EC.VOC', 'Expressão Vocal (Ato Físico)', 'Produção de som com a boca.', 'AC.EC', 'AC.EC', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['falar', 'cantar', 'gritar', 'sussurrar']),
  ('AC.EC.COR', 'Expressão Corporal (Gestual)', 'Uso do corpo para comunicar.', 'AC.EC', 'AC.EC', 3, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['acenar', 'apontar', 'abraçar', 'beijar']);

-- ====================
-- FASE 4: Inserir 23 N4
-- ====================

-- Sob AC.MD.LOC (Locomoção)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.MD.LOC.BIP', 'Movimento Bípede/Quadrúpede', 'Mover corpo de ponto a ponto.', 'AC.MD.LOC', 'AC.MD.LOC', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['andar', 'correr', 'caminhar', 'rastejar']),
  ('AC.MD.LOC.IMP', 'Movimentos de Impulso', 'Impulsionar o corpo.', 'AC.MD.LOC', 'AC.MD.LOC', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['pular', 'saltar', 'mergulhar', 'cair']),
  ('AC.MD.LOC.MEI', 'Movimento em Meios Específicos', 'Mover em água, ar, montanha.', 'AC.MD.LOC', 'AC.MD.LOC', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['nadar', 'voar', 'escalar', 'cavalgar']);

-- Sob AC.MD.POST (Mudança de Postura)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.MD.POST.VER', 'Movimentos Verticais', 'Alterar posição verticalmente.', 'AC.MD.POST', 'AC.MD.POST', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['levantar', 'agachar', 'sentar', 'deitar']),
  ('AC.MD.POST.ROT', 'Movimentos de Rotação e Direção', 'Girar ou mudar direção.', 'AC.MD.POST', 'AC.MD.POST', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['virar', 'girar', 'inclinar', 'recuar']);

-- Sob AC.MI.POS (Posse e Contato)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.MI.POS.TOM', 'Tomar e Largar', 'Iniciar ou cessar contato.', 'AC.MI.POS', 'AC.MI.POS', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['pegar', 'agarrar', 'soltar', 'largar']),
  ('AC.MI.POS.MAN', 'Manter Contato', 'Sustentar contato com objeto.', 'AC.MI.POS', 'AC.MI.POS', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['segurar', 'carregar', 'sustentar', 'tocar']);

-- Sob AC.MI.FOR (Força Aplicada)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.MI.FOR.EMP', 'Empurrar e Puxar', 'Aplicar força linear.', 'AC.MI.FOR', 'AC.MI.FOR', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['empurrar', 'puxar', 'arrastar', 'rebocar']),
  ('AC.MI.FOR.LAN', 'Lançamento e Projeção', 'Projetar objeto no espaço.', 'AC.MI.FOR', 'AC.MI.FOR', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['jogar', 'lançar', 'atirar', 'arremessar']),
  ('AC.MI.FOR.IMP', 'Impacto', 'Aplicar força de impacto.', 'AC.MI.FOR', 'AC.MI.FOR', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['bater', 'golpear', 'chutar', 'socar']);

-- Sob AC.MI.JUN (Junção e Separação)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.MI.JUN.CON', 'Conectar e Desconectar', 'Unir ou separar componentes.', 'AC.MI.JUN', 'AC.MI.JUN', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['amarrar', 'atar', 'colar', 'desamarrar']),
  ('AC.MI.JUN.ABR', 'Abrir e Fechar', 'Alterar estado de abertura.', 'AC.MI.JUN', 'AC.MI.JUN', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['abrir', 'fechar', 'tapar', 'destapar']);

-- Sob AC.TR.CRI (Criação e Construção)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.TR.CRI.CON', 'Construção e Montagem', 'Edificar ou montar estruturas.', 'AC.TR.CRI', 'AC.TR.CRI', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['construir', 'montar', 'edificar', 'tecer']),
  ('AC.TR.CRI.MAR', 'Marcação e Desenho (Ato Físico)', 'Criar marcas visuais.', 'AC.TR.CRI', 'AC.TR.CRI', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['escrever', 'desenhar', 'pintar', 'riscar']);

-- Sob AC.TR.DES (Destruição e Desmontagem)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.TR.DES.QUE', 'Quebra e Fragmentação', 'Desfazer ou estilhaçar.', 'AC.TR.DES', 'AC.TR.DES', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['quebrar', 'destruir', 'demolir', 'rasgar']),
  ('AC.TR.DES.COR', 'Corte e Divisão', 'Separar por corte.', 'AC.TR.DES', 'AC.TR.DES', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['cortar', 'fatiar', 'picar', 'serrar']),
  ('AC.TR.DES.REM', 'Remoção e Limpeza', 'Remover matéria ou sujeira.', 'AC.TR.DES', 'AC.TR.DES', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['limpar', 'varrer', 'apagar', 'cavar']);

-- Sob AC.PS.VIS (Percepção Visual)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.PS.VIS.FOC', 'Foco Visual', 'Direcionar atenção visual.', 'AC.PS.VIS', 'AC.PS.VIS', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['olhar', 'ver', 'observar', 'espiar']);

-- Sob AC.PS.AUD (Percepção Auditiva)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.PS.AUD.FOC', 'Foco Auditivo', 'Direcionar atenção auditiva.', 'AC.PS.AUD', 'AC.PS.AUD', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['escutar', 'ouvir', 'auscultar']);

-- Sob AC.PS.OUT (Percepção Tátil/Olfativa/Gustativa)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.PS.OUT.EXP', 'Exploração Sensorial', 'Explorar com sentidos diversos.', 'AC.PS.OUT', 'AC.PS.OUT', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['cheirar', 'farejar', 'provar', 'apalpar']);

-- Sob AC.EC.VOC (Expressão Vocal)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.EC.VOC.FAL', 'Produção de Fala e Canto', 'Articular palavras ou melodias.', 'AC.EC.VOC', 'AC.EC.VOC', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['falar', 'dizer', 'cantar', 'recitar']),
  ('AC.EC.VOC.SOM', 'Produção de Sons Expressivos', 'Emitir sons não-verbais.', 'AC.EC.VOC', 'AC.EC.VOC', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['gritar', 'sussurrar', 'gemer', 'chorar']);

-- Sob AC.EC.COR (Expressão Corporal)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, tagset_pai, nivel_profundidade, status, aprovado_em, aprovado_por, exemplos)
VALUES 
  ('AC.EC.COR.GES', 'Gestos e Sinais', 'Comunicar com gestos.', 'AC.EC.COR', 'AC.EC.COR', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['acenar', 'apontar', 'gesticular', 'sinalizar']),
  ('AC.EC.COR.INT', 'Interação Física Social', 'Expressar com toque social.', 'AC.EC.COR', 'AC.EC.COR', 4, 'ativo', NOW(), '00000000-0000-0000-0000-000000000000', ARRAY['abraçar', 'beijar', 'apertar a mão']);

-- ====================
-- FASE 5: Recalcular hierarquia
-- ====================
SELECT calculate_tagset_hierarchy();