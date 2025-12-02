
-- ATUALIZAÇÃO EQ e EL sem aprovado_por

-- Atualizar descrições N1
UPDATE semantic_tagset SET descricao = 'Agrupa atributos, características e propriedades que descrevem seres, objetos, ambientes ou fenômenos. Abrange desde qualidades físicas perceptíveis (cor, forma) e estados (limpo, quebrado) até qualidades abstratas (importância, dificuldade) e sistemas de medida (tempo, distância).' WHERE codigo = 'EQ';
UPDATE semantic_tagset SET descricao = 'Agrupa termos que designam construções, edificações, infraestruturas e espaços físicos criados ou modificados pelo ser humano. Abrange desde os componentes de uma casa até grandes obras de engenharia e as regiões definidas por elas.' WHERE codigo = 'EL';

-- EQ N2s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EQ.PF', 'Propriedades Físicas (Perceptíveis)', 'Qualidades inerentes a um objeto ou ser que podem ser percebidas pelos sentidos.', 'EQ', ARRAY['visível', 'tangível'], 'ativo'),
('EQ.EC', 'Estados e Condições', 'A condição ou situação em que algo se encontra em um determinado momento.', 'EQ', ARRAY['estado', 'condição'], 'ativo'),
('EQ.QA', 'Qualidades Abstratas e Avaliativas', 'Atributos não-físicos que resultam de um julgamento, comparação ou experiência.', 'EQ', ARRAY['qualidade', 'avaliação'], 'ativo'),
('EQ.SM', 'Sistemas de Medida e Quantidade', 'Termos usados para quantificar, contar ou medir o mundo.', 'EQ', ARRAY['medida', 'quantidade'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao;

-- EQ.PF N3s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EQ.PF.VI', 'Propriedades Visuais', 'Características percebidas pela visão.', 'EQ.PF', ARRAY['cor', 'forma', 'tamanho'], 'ativo'),
('EQ.PF.FQ', 'Propriedades Físico-Químicas', 'Qualidades relacionadas à matéria e energia.', 'EQ.PF', ARRAY['temperatura', 'consistência'], 'ativo'),
('EQ.PF.SE', 'Propriedades Sensoriais (Não-Visuais)', 'Características percebidas por outros sentidos.', 'EQ.PF', ARRAY['som', 'cheiro', 'sabor'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao;

-- EQ.PF.VI N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EQ.PF.VI.CM', 'Cor e Matiz', 'Cores e tonalidades.', 'EQ.PF.VI', ARRAY['vermelho', 'azul', 'verde', 'claro', 'escuro'], 'ativo'),
('EQ.PF.VI.FE', 'Forma e Estrutura', 'Formatos e contornos.', 'EQ.PF.VI', ARRAY['redondo', 'quadrado', 'reto', 'curvo'], 'ativo'),
('EQ.PF.VI.TD', 'Tamanho e Dimensão', 'Dimensões e proporções.', 'EQ.PF.VI', ARRAY['grande', 'pequeno', 'alto', 'baixo'], 'ativo'),
('EQ.PF.VI.AT', 'Aparência e Textura', 'Aspecto visual e tátil.', 'EQ.PF.VI', ARRAY['liso', 'áspero', 'brilhante', 'opaco'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, exemplos = EXCLUDED.exemplos;

-- EQ.PF.FQ N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EQ.PF.FQ.TE', 'Temperatura', 'Grau de calor ou frio.', 'EQ.PF.FQ', ARRAY['quente', 'frio', 'morno', 'gelado'], 'ativo'),
('EQ.PF.FQ.CD', 'Consistência e Densidade', 'Textura e compactação da matéria.', 'EQ.PF.FQ', ARRAY['duro', 'mole', 'macio', 'denso'], 'ativo'),
('EQ.PF.FQ.PE', 'Peso', 'Leveza ou peso relativo.', 'EQ.PF.FQ', ARRAY['leve', 'pesado'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, exemplos = EXCLUDED.exemplos;

-- EQ.PF.SE N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EQ.PF.SE.SO', 'Som e Ruído', 'Propriedades sonoras.', 'EQ.PF.SE', ARRAY['alto', 'baixo', 'agudo', 'grave', 'silencioso'], 'ativo'),
('EQ.PF.SE.OD', 'Odor e Aroma', 'Propriedades olfativas.', 'EQ.PF.SE', ARRAY['cheiroso', 'fedido', 'perfumado'], 'ativo'),
('EQ.PF.SE.SG', 'Sabor e Gosto', 'Propriedades gustativas.', 'EQ.PF.SE', ARRAY['doce', 'salgado', 'amargo', 'azedo'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, exemplos = EXCLUDED.exemplos;

-- EQ.EC N3s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EQ.EC.IF', 'Estado de Integridade Física', 'A condição do objeto em relação à sua forma original.', 'EQ.EC', ARRAY['novo', 'quebrado', 'limpo'], 'ativo'),
('EQ.EC.PC', 'Estado de Posição e Conteúdo', 'A situação espacial ou de preenchimento.', 'EQ.EC', ARRAY['aberto', 'fechado', 'cheio'], 'ativo'),
('EQ.EC.ED', 'Estado de Existência e Disponibilidade', 'A condição de algo existir ou estar acessível.', 'EQ.EC', ARRAY['presente', 'ausente'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao;

-- EQ.EC N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EQ.EC.IF.ID', 'Integridade e Dano', 'Condição de conservação.', 'EQ.EC.IF', ARRAY['novo', 'velho', 'quebrado', 'intacto'], 'ativo'),
('EQ.EC.IF.LI', 'Estado de Limpeza', 'Condição de higiene.', 'EQ.EC.IF', ARRAY['limpo', 'sujo', 'manchado'], 'ativo'),
('EQ.EC.PC.PR', 'Posição Relativa', 'Estado espacial de um objeto.', 'EQ.EC.PC', ARRAY['aberto', 'fechado', 'deitado'], 'ativo'),
('EQ.EC.PC.CP', 'Conteúdo e Preenchimento', 'Estado de ocupação interna.', 'EQ.EC.PC', ARRAY['cheio', 'vazio', 'completo'], 'ativo'),
('EQ.EC.ED.PA', 'Presença e Ausência', 'Existência ou falta.', 'EQ.EC.ED', ARRAY['presente', 'ausente', 'falta'], 'ativo'),
('EQ.EC.ED.DI', 'Disponibilidade', 'Acessibilidade de algo.', 'EQ.EC.ED', ARRAY['disponível', 'livre', 'ocupado'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, exemplos = EXCLUDED.exemplos;

-- EQ.QA N3s e N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EQ.QA.AJ', 'Qualidades de Avaliação e Julgamento', 'Juízos de valor.', 'EQ.QA', ARRAY['bom', 'mau', 'importante'], 'ativo'),
('EQ.QA.EE', 'Qualidades de Execução e Experiência', 'Características de realização.', 'EQ.QA', ARRAY['fácil', 'difícil', 'rápido'], 'ativo'),
('EQ.QA.AJ.QV', 'Qualidade e Valor', 'Juízo sobre mérito.', 'EQ.QA.AJ', ARRAY['bom', 'mau', 'excelente', 'péssimo'], 'ativo'),
('EQ.QA.AJ.IR', 'Importância e Relevância', 'Grau de significância.', 'EQ.QA.AJ', ARRAY['importante', 'essencial', 'irrelevante'], 'ativo'),
('EQ.QA.AJ.CP', 'Certeza e Probabilidade', 'Grau de verdade ou chance.', 'EQ.QA.AJ', ARRAY['certo', 'errado', 'provável'], 'ativo'),
('EQ.QA.EE.DF', 'Dificuldade e Facilidade', 'Grau de complexidade.', 'EQ.QA.EE', ARRAY['fácil', 'difícil', 'simples'], 'ativo'),
('EQ.QA.EE.VR', 'Velocidade e Ritmo', 'Rapidez ou lentidão.', 'EQ.QA.EE', ARRAY['rápido', 'lento', 'veloz'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, exemplos = EXCLUDED.exemplos;

-- EQ.SM N3s e N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EQ.SM.TT', 'Tempo e Temporalidade', 'Medidas e conceitos de tempo.', 'EQ.SM', ARRAY['hora', 'dia', 'semana'], 'ativo'),
('EQ.SM.ME', 'Medidas Espaciais', 'Quantificação do espaço.', 'EQ.SM', ARRAY['metro', 'quilômetro'], 'ativo'),
('EQ.SM.QM', 'Medidas de Quantidade, Volume e Massa', 'Quantificação de matéria.', 'EQ.SM', ARRAY['litro', 'quilo'], 'ativo'),
('EQ.SM.TT.UT', 'Unidades de Tempo', 'Medidas convencionais.', 'EQ.SM.TT', ARRAY['segundo', 'minuto', 'hora', 'dia'], 'ativo'),
('EQ.SM.TT.PE', 'Períodos e Épocas', 'Intervalos temporais.', 'EQ.SM.TT', ARRAY['período', 'era', 'época'], 'ativo'),
('EQ.SM.TT.RF', 'Relações e Frequência Temporal', 'Sequência e repetição.', 'EQ.SM.TT', ARRAY['antes', 'depois', 'sempre', 'nunca'], 'ativo'),
('EQ.SM.ME.DC', 'Distância e Comprimento', 'Medidas lineares.', 'EQ.SM.ME', ARRAY['metro', 'quilômetro', 'légua'], 'ativo'),
('EQ.SM.ME.AS', 'Área e Superfície', 'Medidas de extensão plana.', 'EQ.SM.ME', ARRAY['hectare', 'alqueire'], 'ativo'),
('EQ.SM.QM.QC', 'Quantidade e Contagem', 'Número de itens.', 'EQ.SM.QM', ARRAY['quantidade', 'número', 'dúzia'], 'ativo'),
('EQ.SM.QM.VC', 'Volume e Capacidade', 'Medidas de espaço interno.', 'EQ.SM.QM', ARRAY['litro', 'galão', 'xícara'], 'ativo'),
('EQ.SM.QM.MA', 'Massa (Peso Quantificado)', 'Medidas de peso.', 'EQ.SM.QM', ARRAY['quilo', 'grama', 'tonelada'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, exemplos = EXCLUDED.exemplos;

-- EL N2s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EL.CE', 'Construções e Edificações', 'Estruturas físicas construídas para abrigar pessoas ou objetos.', 'EL', ARRAY['casa', 'prédio'], 'ativo'),
('EL.IU', 'Infraestrutura Urbana', 'Sistemas de suporte em cidades.', 'EL', ARRAY['rua', 'calçada'], 'ativo'),
('EL.IR', 'Infraestrutura Rural', 'Sistemas de suporte no campo.', 'EL', ARRAY['estrada de chão', 'cerca'], 'ativo'),
('EL.ER', 'Espaços e Regiões Definidas', 'Áreas definidas pela ocupação humana.', 'EL', ARRAY['cidade', 'fazenda'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao;

-- EL.CE N3s e N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EL.CE.MO', 'Tipos de Moradia', 'Edificações para habitação.', 'EL.CE', ARRAY['casa', 'apartamento'], 'ativo'),
('EL.CE.PC', 'Edificações Públicas, Comerciais e Industriais', 'Construções de trabalho ou comércio.', 'EL.CE', ARRAY['loja', 'escola'], 'ativo'),
('EL.CE.PA', 'Partes de uma Construção', 'Componentes de uma edificação.', 'EL.CE', ARRAY['parede', 'porta'], 'ativo'),
('EL.CE.MO.RE', 'Residências', 'Moradias permanentes.', 'EL.CE.MO', ARRAY['casa', 'apartamento', 'sobrado'], 'ativo'),
('EL.CE.MO.HR', 'Habitações Rústicas ou Temporárias', 'Moradias simples.', 'EL.CE.MO', ARRAY['rancho', 'cabana', 'barraco'], 'ativo'),
('EL.CE.MO.GR', 'Grandes Residências', 'Moradias de grande porte.', 'EL.CE.MO', ARRAY['palácio', 'mansão', 'estância'], 'ativo'),
('EL.CE.PC.CS', 'Comerciais e de Serviços', 'Estabelecimentos comerciais.', 'EL.CE.PC', ARRAY['loja', 'mercado', 'hotel'], 'ativo'),
('EL.CE.PC.IC', 'Institucionais e Comunitárias', 'Edificações de serviço público.', 'EL.CE.PC', ARRAY['escola', 'hospital', 'igreja'], 'ativo'),
('EL.CE.PC.IP', 'Industriais e de Produção', 'Instalações de manufatura.', 'EL.CE.PC', ARRAY['fábrica', 'usina', 'galpão'], 'ativo'),
('EL.CE.PC.LC', 'De Lazer e Cultura', 'Espaços de entretenimento.', 'EL.CE.PC', ARRAY['teatro', 'cinema', 'estádio'], 'ativo'),
('EL.CE.PA.EF', 'Estruturais e de Fechamento', 'Elementos da estrutura básica.', 'EL.CE.PA', ARRAY['parede', 'telhado', 'piso'], 'ativo'),
('EL.CE.PA.AA', 'Aberturas e Acessos', 'Elementos de entrada e circulação.', 'EL.CE.PA', ARRAY['porta', 'janela', 'escada'], 'ativo'),
('EL.CE.PA.CI', 'Cômodos e Espaços Internos', 'Divisões internas.', 'EL.CE.PA', ARRAY['quarto', 'sala', 'cozinha'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, exemplos = EXCLUDED.exemplos;

-- EL.IU N3s e N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EL.IU.VT', 'Vias e Transporte Urbano', 'Rede de caminhos em cidades.', 'EL.IU', ARRAY['rua', 'avenida'], 'ativo'),
('EL.IU.RS', 'Redes de Serviços Públicos', 'Sistemas de água, energia, saneamento.', 'EL.IU', ARRAY['esgoto', 'fiação'], 'ativo'),
('EL.IU.MS', 'Mobiliário e Sinalização Urbana', 'Objetos em espaços públicos.', 'EL.IU', ARRAY['banco de praça', 'semáforo'], 'ativo'),
('EL.IU.VT.VP', 'Vias Pavimentadas', 'Caminhos com superfície preparada.', 'EL.IU.VT', ARRAY['rua', 'avenida', 'viaduto'], 'ativo'),
('EL.IU.VT.PC', 'Estruturas para Pedestres e Ciclistas', 'Vias exclusivas.', 'EL.IU.VT', ARRAY['calçada', 'passarela', 'ciclovia'], 'ativo'),
('EL.IU.VT.TP', 'Infraestrutura de Transporte Público', 'Estruturas de transporte coletivo.', 'EL.IU.VT', ARRAY['ponto de ônibus', 'estação de metrô'], 'ativo'),
('EL.IU.RS.SD', 'Saneamento e Drenagem', 'Sistemas de água e esgoto.', 'EL.IU.RS', ARRAY['rede de esgoto', 'bueiro'], 'ativo'),
('EL.IU.RS.EC', 'Energia e Comunicação', 'Redes elétricas.', 'EL.IU.RS', ARRAY['fiação elétrica', 'poste de luz'], 'ativo'),
('EL.IU.MS.MO', 'Mobiliário', 'Equipamentos urbanos.', 'EL.IU.MS', ARRAY['banco de praça', 'lixeira', 'hidrante'], 'ativo'),
('EL.IU.MS.SI', 'Sinalização', 'Elementos de orientação.', 'EL.IU.MS', ARRAY['semáforo', 'placa de rua'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, exemplos = EXCLUDED.exemplos;

-- EL.IR N3s e N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EL.IR.VA', 'Vias e Acessos Rurais', 'Caminhos no campo.', 'EL.IR', ARRAY['estrada de chão', 'trilha'], 'ativo'),
('EL.IR.DM', 'Estruturas de Delimitação e Manejo', 'Construções para controle.', 'EL.IR', ARRAY['cerca', 'porteira', 'curral'], 'ativo'),
('EL.IR.SP', 'Estruturas de Suporte à Produção e Recursos', 'Construções agrícolas.', 'EL.IR', ARRAY['silo', 'celeiro', 'poço'], 'ativo'),
('EL.IR.VA.NP', 'Vias Não-Pavimentadas', 'Caminhos de terra.', 'EL.IR.VA', ARRAY['estrada de chão', 'trilha', 'picada'], 'ativo'),
('EL.IR.VA.TR', 'Travessias Rústicas', 'Estruturas simples de travessia.', 'EL.IR.VA', ARRAY['ponte de madeira', 'pinguela'], 'ativo'),
('EL.IR.DM.CB', 'Cercas e Barreiras', 'Estruturas de delimitação.', 'EL.IR.DM', ARRAY['cerca de arame', 'porteira', 'mata-burro'], 'ativo'),
('EL.IR.DM.MA', 'Estruturas de Manejo Animal', 'Instalações para animais.', 'EL.IR.DM', ARRAY['curral', 'mangueira', 'brete'], 'ativo'),
('EL.IR.SP.AP', 'Armazenamento e Processamento', 'Estruturas de armazenamento.', 'EL.IR.SP', ARRAY['silo', 'celeiro', 'tulha'], 'ativo'),
('EL.IR.SP.RH', 'Acesso a Recursos Hídricos', 'Estruturas de captação de água.', 'EL.IR.SP', ARRAY['poço', 'cisterna', 'açude'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, exemplos = EXCLUDED.exemplos;

-- EL.ER N3s e N4s
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES 
('EL.ER.AU', 'Áreas Urbanas e Assentamentos', 'Aglomerações de alta densidade.', 'EL.ER', ARRAY['cidade', 'vila', 'bairro'], 'ativo'),
('EL.ER.AR', 'Áreas Rurais e de Produção', 'Regiões de baixa densidade.', 'EL.ER', ARRAY['fazenda', 'sítio', 'roça'], 'ativo'),
('EL.ER.EP', 'Espaços Públicos e de Convivência', 'Áreas de uso comunitário.', 'EL.ER', ARRAY['praça', 'parque', 'pátio'], 'ativo'),
('EL.ER.AU.TA', 'Tipos de Assentamento', 'Classificação de aglomerações.', 'EL.ER.AU', ARRAY['cidade', 'metrópole', 'vila', 'bairro'], 'ativo'),
('EL.ER.AR.PZ', 'Propriedades e Zonas Rurais', 'Tipos de propriedades agrícolas.', 'EL.ER.AR', ARRAY['fazenda', 'chácara', 'sítio', 'roça'], 'ativo'),
('EL.ER.EP.LE', 'Áreas de Lazer e Encontro', 'Espaços de recreação.', 'EL.ER.EP', ARRAY['praça', 'parque', 'jardim'], 'ativo'),
('EL.ER.EP.PM', 'Locais de Passagem e Memória', 'Espaços de trânsito e memória.', 'EL.ER.EP', ARRAY['esquina', 'cemitério', 'monumento'], 'ativo')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, exemplos = EXCLUDED.exemplos;

-- Recalcular hierarquia
SELECT calculate_tagset_hierarchy();
