-- Migração: Hierarquia completa do Indivíduo (SH)
-- Atualizar N1 + Descontinuar SH.03 + Criar 4 N2s + 9 N3s + 25 N4s

-- Fase 1: Atualizar N1 existente
UPDATE semantic_tagset 
SET 
  nome = 'Indivíduo',
  descricao = 'Termos relacionados ao ser humano individual: anatomia, fisiologia, ciclos da vida, relações interpessoais e identidade.'
WHERE codigo = 'SH';

-- Fase 2: Descontinuar N2 obsoleto
UPDATE semantic_tagset 
SET 
  status = 'descontinuado',
  rejection_reason = 'Substituído por SH.RI (Relações Interpessoais) na reestruturação da hierarquia'
WHERE codigo = 'SH.03';

-- Fase 3: Inserir 4 N2s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status) VALUES
('SH.AF', 'Anatomia e Fisiologia', 'Termos relacionados ao corpo humano, suas partes, sistemas e funções vitais básicas.', 'SH', 2, ARRAY['corpo', 'coração', 'respiração', 'visão'], 'ativo'),
('SH.CV', 'Ciclos da Vida', 'Termos que descrevem as fases e os eventos marcantes da existência humana.', 'SH', 2, ARRAY['nascimento', 'infância', 'juventude', 'velhice', 'morte'], 'ativo'),
('SH.RI', 'Relações Interpessoais', 'Termos que definem os laços e papéis sociais que um indivíduo estabelece com outros.', 'SH', 2, ARRAY['pai', 'mãe', 'amigo', 'vizinho', 'chefe'], 'ativo'),
('SH.IT', 'Identidade e Tipos Humanos', 'Termos genéricos para pessoas e categorias que descrevem a identidade ou condição de um indivíduo.', 'SH', 2, ARRAY['pessoa', 'gente', 'homem', 'mulher', 'povo'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  categoria_pai = EXCLUDED.categoria_pai,
  nivel_profundidade = EXCLUDED.nivel_profundidade,
  exemplos = EXCLUDED.exemplos;

-- Fase 4: Inserir 9 N3s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status) VALUES
-- Anatomia e Fisiologia (SH.AF)
('SH.AF.AH', 'Anatomia Humana', 'Partes físicas e componentes do corpo.', 'SH.AF', 3, ARRAY['cabeça', 'rosto', 'braço', 'perna', 'coração', 'osso'], 'ativo'),
('SH.AF.FS', 'Funções Fisiológicas e Sensoriais', 'Processos e percepções básicas do corpo.', 'SH.AF', 3, ARRAY['respiração', 'pulsação', 'visão', 'audição', 'bocejo'], 'ativo'),

-- Ciclos da Vida (SH.CV)
('SH.CV.FV', 'Fases da Vida', 'Estágios do desenvolvimento humano.', 'SH.CV', 3, ARRAY['bebê', 'criança', 'jovem', 'adulto', 'idoso'], 'ativo'),
('SH.CV.EM', 'Eventos Marcantes da Vida', 'Ritos de passagem e momentos cruciais da jornada pessoal.', 'SH.CV', 3, ARRAY['nascimento', 'morte', 'casamento', 'batismo', 'funeral'], 'ativo'),

-- Relações Interpessoais (SH.RI)
('SH.RI.RF', 'Relações Familiares', 'Vínculos de parentesco, consanguíneos ou por afinidade.', 'SH.RI', 3, ARRAY['pai', 'mãe', 'filho', 'avô', 'sogro', 'compadre'], 'ativo'),
('SH.RI.SC', 'Relações Sociais e Comunitárias', 'Vínculos estabelecidos na comunidade e na sociedade.', 'SH.RI', 3, ARRAY['amigo', 'vizinho', 'chefe', 'colega', 'líder'], 'ativo'),

-- Identidade e Tipos Humanos (SH.IT)
('SH.IT.TG', 'Termos Genéricos para Pessoas', 'Palavras usadas para se referir a seres humanos de forma geral ou coletiva.', 'SH.IT', 3, ARRAY['pessoa', 'gente', 'ser', 'multidão', 'povo'], 'ativo'),
('SH.IT.PC', 'Papéis e Condições de Identidade', 'Termos que definem uma pessoa por seu gênero, papel social ou condição existencial.', 'SH.IT', 3, ARRAY['homem', 'mulher', 'menino', 'órfão', 'viúvo'], 'ativo'),

-- N3 adicional para Anatomia (totalizando 9)
('SH.AF.FC', 'Fluidos e Secreções Corporais', 'Líquidos produzidos pelo corpo humano.', 'SH.AF', 3, ARRAY['sangue', 'suor', 'lágrima', 'saliva'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  categoria_pai = EXCLUDED.categoria_pai,
  nivel_profundidade = EXCLUDED.nivel_profundidade,
  exemplos = EXCLUDED.exemplos;

-- Fase 5: Inserir 25 N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, nivel_profundidade, exemplos, status) VALUES
-- Anatomia Humana (SH.AF.AH)
('SH.AF.AH.PE', 'Partes do Corpo Externas', 'Partes visíveis do corpo humano.', 'SH.AF.AH', 4, ARRAY['cabeça', 'rosto', 'olho', 'boca', 'braço', 'mão', 'perna', 'pé'], 'ativo'),
('SH.AF.AH.OI', 'Órgãos e Sistemas Internos', 'Órgãos vitais e sistemas funcionais do corpo.', 'SH.AF.AH', 4, ARRAY['coração', 'pulmão', 'cérebro', 'estômago', 'fígado'], 'ativo'),
('SH.AF.AH.ET', 'Estruturas e Tecidos', 'Componentes estruturais do corpo.', 'SH.AF.AH', 4, ARRAY['osso', 'músculo', 'pele', 'nervo', 'veia'], 'ativo'),

-- Funções Fisiológicas e Sensoriais (SH.AF.FS)
('SH.AF.FS.FV', 'Funções Vitais', 'Processos essenciais para a manutenção da vida.', 'SH.AF.FS', 4, ARRAY['respiração', 'pulsação', 'digestão', 'sono'], 'ativo'),
('SH.AF.FS.SE', 'Sentidos', 'Percepções sensoriais humanas.', 'SH.AF.FS', 4, ARRAY['visão', 'audição', 'olfato', 'paladar', 'tato'], 'ativo'),
('SH.AF.FS.AI', 'Ações Corporais Involuntárias', 'Reflexos e reações automáticas do corpo.', 'SH.AF.FS', 4, ARRAY['bocejo', 'espirro', 'arrepio', 'piscar'], 'ativo'),

-- Fases da Vida (SH.CV.FV)
('SH.CV.FV.NI', 'Nascimento e Infância', 'Início da vida e fase infantil.', 'SH.CV.FV', 4, ARRAY['nascimento', 'bebê', 'criança', 'guri', 'infância'], 'ativo'),
('SH.CV.FV.JA', 'Juventude e Adolescência', 'Fase de transição entre infância e vida adulta.', 'SH.CV.FV', 4, ARRAY['jovem', 'moço', 'adolescente', 'puberdade'], 'ativo'),
('SH.CV.FV.FA', 'Fase Adulta', 'Período de maturidade e responsabilidades plenas.', 'SH.CV.FV', 4, ARRAY['adulto', 'maturidade', 'meia-idade'], 'ativo'),
('SH.CV.FV.VE', 'Velhice', 'Fase final da vida.', 'SH.CV.FV', 4, ARRAY['idoso', 'velho', 'ancião', 'senilidade', 'terceira idade'], 'ativo'),

-- Eventos Marcantes da Vida (SH.CV.EM)
('SH.CV.EM.IF', 'Início e Fim da Vida', 'Nascimento e morte.', 'SH.CV.EM', 4, ARRAY['nascimento', 'morte', 'falecimento', 'funeral', 'luto'], 'ativo'),
('SH.CV.EM.RP', 'Ritos de Passagem Sociais', 'Cerimônias marcantes da vida social.', 'SH.CV.EM', 4, ARRAY['batismo', 'noivado', 'casamento', 'formatura'], 'ativo'),

-- Relações Familiares (SH.RI.RF)
('SH.RI.RF.PN', 'Parentesco Direto (Nuclear)', 'Família nuclear e cônjuges.', 'SH.RI.RF', 4, ARRAY['pai', 'mãe', 'filho', 'filha', 'irmão', 'irmã', 'cônjuge'], 'ativo'),
('SH.RI.RF.PE', 'Parentesco Estendido', 'Família além do núcleo central.', 'SH.RI.RF', 4, ARRAY['avô', 'avó', 'neto', 'tio', 'primo', 'sobrinho'], 'ativo'),
('SH.RI.RF.PA', 'Parentesco por Afinidade', 'Relações familiares por casamento ou laços espirituais.', 'SH.RI.RF', 4, ARRAY['sogro', 'sogra', 'genro', 'nora', 'cunhado', 'compadre', 'afilhado'], 'ativo'),

-- Relações Sociais e Comunitárias (SH.RI.SC)
('SH.RI.SC.CS', 'Círculo Social Próximo', 'Relações pessoais cotidianas.', 'SH.RI.SC', 4, ARRAY['amigo', 'colega', 'vizinho', 'conhecido'], 'ativo'),
('SH.RI.SC.RH', 'Relações Hierárquicas', 'Vínculos de subordinação ou autoridade.', 'SH.RI.SC', 4, ARRAY['chefe', 'patrão', 'empregado', 'mestre', 'aprendiz', 'discípulo'], 'ativo'),
('SH.RI.SC.PC', 'Papéis Comunitários', 'Funções dentro da comunidade.', 'SH.RI.SC', 4, ARRAY['líder', 'membro', 'forasteiro', 'estrangeiro', 'agregado'], 'ativo'),

-- Termos Genéricos para Pessoas (SH.IT.TG)
('SH.IT.TG.IN', 'Indivíduo', 'Termos singulares para seres humanos.', 'SH.IT.TG', 4, ARRAY['pessoa', 'gente', 'ser', 'indivíduo', 'sujeito', 'criatura'], 'ativo'),
('SH.IT.TG.CO', 'Coletivo', 'Termos para grupos de pessoas.', 'SH.IT.TG', 4, ARRAY['multidão', 'povo', 'população', 'grupo', 'turma', 'plateia'], 'ativo'),

-- Papéis e Condições de Identidade (SH.IT.PC)
('SH.IT.PC.GE', 'Gênero', 'Identidade de gênero.', 'SH.IT.PC', 4, ARRAY['homem', 'mulher', 'menino', 'menina'], 'ativo'),
('SH.IT.PC.CE', 'Condição Existencial', 'Estado civil, social ou existencial da pessoa.', 'SH.IT.PC', 4, ARRAY['órfão', 'viúvo', 'solteiro', 'casado', 'peregrino'], 'ativo'),

-- Fluidos Corporais (SH.AF.FC)
('SH.AF.FC.FL', 'Fluidos Corporais', 'Líquidos produzidos pelo organismo.', 'SH.AF.FC', 4, ARRAY['sangue', 'suor', 'lágrima', 'saliva'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  categoria_pai = EXCLUDED.categoria_pai,
  nivel_profundidade = EXCLUDED.nivel_profundidade,
  exemplos = EXCLUDED.exemplos;

-- Fase 6: Recalcular hierarquia
SELECT calculate_tagset_hierarchy();