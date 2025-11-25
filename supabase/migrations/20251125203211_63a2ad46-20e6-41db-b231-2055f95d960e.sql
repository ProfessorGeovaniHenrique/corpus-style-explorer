-- ========================================
-- MIGRATION: Hierarquia DS "Ser Humano e suas atividades" 
-- Total: 59 categorias (1 N1 atualizado + 6 N2 + 17 N3 + 35 N4)
-- CORREÇÃO V2: Deletar recursivamente em ordem reversa
-- ========================================

-- FASE 1: Limpeza Recursiva (N4 → N3 → N2)

-- Step 1: Deletar todos N4 e N3 que são filhos de 02.%
DELETE FROM semantic_tagset 
WHERE categoria_pai LIKE '02.%' AND categoria_pai != '02';

-- Step 2: Deletar todos N2 (filhos diretos de 02)
DELETE FROM semantic_tagset 
WHERE categoria_pai = '02' AND codigo != '02';

-- FASE 2: Atualizar N1
UPDATE semantic_tagset 
SET 
  nome = 'Ser Humano e suas atividades',
  descricao = 'Agrupa termos relacionados ao indivíduo, suas características, ciclos de vida, relações, bem como as atividades, criações e conceitos que definem a experiência humana.',
  status = 'ativo',
  tagset_pai = NULL,
  nivel_profundidade = 1
WHERE codigo = '02';

-- FASE 3: Inserir N2 (6 categorias)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, status) VALUES
('02.01', 'O Indivíduo', 'Termos que descrevem o ser humano como entidade biológica e social.', '02', 'ativo'),
('02.02', 'Trabalho e Economia', 'Atividades produtivas, profissões e transações comerciais.', '02', 'ativo'),
('02.03', 'Habitação e Vida Cotidiana', 'Termos do dia a dia, relacionados à casa, alimentação e vestuário.', '02', 'ativo'),
('02.04', 'Vida Social e Lazer', 'Atividades de entretenimento, celebrações e esportes.', '02', 'ativo'),
('02.05', 'Cognição e Cultura', 'Termos abstratos relacionados ao pensamento, arte, crenças e comunicação.', '02', 'ativo'),
('02.06', 'Transporte e Movimento', 'Deslocamento de pessoas e coisas.', '02', 'ativo');

-- FASE 4: Inserir N3 (17 categorias)

-- Sob 02.01 O Indivíduo (3 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, status) VALUES
('02.01.01', 'Anatomia Humana', 'Partes do corpo e sistemas biológicos.', '02.01', 'ativo'),
('02.01.02', 'Ciclos da Vida', 'Fases e eventos marcantes da existência humana.', '02.01', 'ativo'),
('02.01.03', 'Relações Interpessoais', 'Laços e papéis sociais que um indivíduo estabelece.', '02.01', 'ativo');

-- Sob 02.02 Trabalho e Economia (3 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, status) VALUES
('02.02.01', 'Trabalho Rural (Agropecuária)', 'Lida no campo, com a terra e os animais.', '02.02', 'ativo'),
('02.02.02', 'Profissões e Ofícios', 'Ocupações e cargos, tanto rurais quanto urbanos.', '02.02', 'ativo'),
('02.02.03', 'Comércio e Finanças', 'Termos relacionados a trocas, dinheiro e valores.', '02.02', 'ativo');

-- Sob 02.03 Habitação e Vida Cotidiana (4 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, status) VALUES
('02.03.01', 'Moradia e Construções', 'Lugares de vivência e suas partes.', '02.03', 'ativo'),
('02.03.02', 'Mobiliário e Utensílios', 'Objetos que compõem o ambiente doméstico.', '02.03', 'ativo'),
('02.03.03', 'Alimentação', 'Comidas, bebidas e o ato de se alimentar.', '02.03', 'ativo'),
('02.03.04', 'Vestuário e Acessórios', 'Roupas e adornos usados pelas pessoas.', '02.03', 'ativo');

-- Sob 02.04 Vida Social e Lazer (3 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, status) VALUES
('02.04.01', 'Festas e Celebrações', 'Eventos sociais e comemorações.', '02.04', 'ativo'),
('02.04.02', 'Esportes e Jogos', 'Competições e atividades lúdicas.', '02.04', 'ativo'),
('02.04.03', 'Hobbies e Passatempos', 'Atividades de lazer e entretenimento pessoal.', '02.04', 'ativo');

-- Sob 02.05 Cognição e Cultura (3 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, status) VALUES
('02.05.01', 'Comunicação e Linguagem', 'Formas de expressão e troca de informações.', '02.05', 'ativo'),
('02.05.02', 'Arte e Expressão Cultural', 'Manifestações artísticas e culturais.', '02.05', 'ativo'),
('02.05.03', 'Conhecimento e Crenças', 'Educação, aprendizado e sistemas de crença.', '02.05', 'ativo');

-- Sob 02.06 Transporte e Movimento (3 N3)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, status) VALUES
('02.06.01', 'Meios de Transporte', 'Veículos e animais usados para locomoção.', '02.06', 'ativo'),
('02.06.02', 'Infraestrutura Viária', 'Caminhos e estruturas para o deslocamento.', '02.06', 'ativo'),
('02.06.03', 'Ações de Deslocamento', 'Verbos que indicam movimento e viagem.', '02.06', 'ativo');

-- FASE 5: Inserir N4 (35 categorias)

-- Sob 02.01.01 Anatomia Humana (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.01.01.01', 'Partes do Corpo', 'Partes visíveis e estruturas anatômicas externas.', '02.01.01', ARRAY['cabeça', 'braço', 'mão', 'perna', 'pé', 'rosto', 'olho', 'boca', 'orelha', 'nariz'], 'ativo'),
('02.01.01.02', 'Órgãos e Sistemas', 'Órgãos internos e sistemas corporais.', '02.01.01', ARRAY['coração', 'pulmão', 'cérebro', 'sangue', 'osso', 'fígado', 'estômago'], 'ativo');

-- Sob 02.01.02 Ciclos da Vida (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.01.02.01', 'Fases da Vida', 'Etapas do desenvolvimento humano.', '02.01.02', ARRAY['infância', 'juventude', 'velhice', 'guri', 'moça', 'ancião', 'criança', 'adulto'], 'ativo'),
('02.01.02.02', 'Eventos da Vida', 'Marcos e acontecimentos significativos.', '02.01.02', ARRAY['nascimento', 'casamento', 'formatura', 'morte', 'batismo', 'aniversário'], 'ativo');

-- Sob 02.01.03 Relações Interpessoais (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.01.03.01', 'Família', 'Parentesco e relações familiares.', '02.01.03', ARRAY['pai', 'mãe', 'filho', 'irmão', 'avô', 'tio', 'primo', 'compadre', 'afilhado'], 'ativo'),
('02.01.03.02', 'Relações Sociais', 'Relações não-familiares e papéis sociais.', '02.01.03', ARRAY['amigo', 'vizinho', 'colega', 'patrão', 'peão', 'agregado', 'conhecido'], 'ativo');

-- Sob 02.02.01 Trabalho Rural (3 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.02.01.01', 'Atividades Agrícolas', 'Trabalho com a terra e cultivos.', '02.02.01', ARRAY['plantar', 'colher', 'semear', 'arar', 'capinar', 'roçar', 'ceifar'], 'ativo'),
('02.02.01.02', 'Atividades Pecuárias', 'Trabalho com animais e criação.', '02.02.01', ARRAY['domar', 'marcar', 'pastorear', 'carnear', 'tosquiar', 'ferrar', 'amansar'], 'ativo'),
('02.02.01.03', 'Ferramentas e Equipamentos', 'Instrumentos de trabalho rural.', '02.02.01', ARRAY['arado', 'foice', 'laço', 'trator', 'mangueira', 'enxada', 'machado'], 'ativo');

-- Sob 02.02.02 Profissões e Ofícios (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.02.02.01', 'Profissões Urbanas', 'Ocupações típicas de áreas urbanas.', '02.02.02', ARRAY['médico', 'professor', 'advogado', 'engenheiro', 'comerciante', 'funcionário'], 'ativo'),
('02.02.02.02', 'Ofícios Tradicionais', 'Profissões artesanais e tradicionais.', '02.02.02', ARRAY['ferreiro', 'carpinteiro', 'sapateiro', 'tropeiro', 'domador', 'costureira'], 'ativo');

-- Sob 02.02.03 Comércio e Finanças (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.02.03.01', 'Transações', 'Ações de compra, venda e troca.', '02.02.03', ARRAY['comprar', 'vender', 'pagar', 'trocar', 'negociar', 'pechincha', 'regatear'], 'ativo'),
('02.02.03.02', 'Dinheiro e Valores', 'Termos relacionados a finanças.', '02.02.03', ARRAY['dinheiro', 'preço', 'dívida', 'lucro', 'juro', 'fortuna', 'salário'], 'ativo');

-- Sob 02.03.01 Moradia e Construções (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.03.01.01', 'Tipos de Moradia', 'Diferentes estilos de habitação.', '02.03.01', ARRAY['casa', 'rancho', 'apartamento', 'estância', 'galpão', 'tapera', 'vivenda'], 'ativo'),
('02.03.01.02', 'Partes da Casa', 'Cômodos e estruturas da moradia.', '02.03.01', ARRAY['cozinha', 'quarto', 'sala', 'varanda', 'telhado', 'porta', 'janela', 'parede'], 'ativo');

-- Sob 02.03.02 Mobiliário e Utensílios (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.03.02.01', 'Móveis', 'Peças de mobiliário doméstico.', '02.03.02', ARRAY['mesa', 'cadeira', 'cama', 'armário', 'banco', 'sofá', 'estante'], 'ativo'),
('02.03.02.02', 'Utensílios Domésticos', 'Objetos de uso cotidiano.', '02.03.02', ARRAY['prato', 'copo', 'panela', 'faca', 'cuia', 'chaleira', 'colher', 'tigela'], 'ativo');

-- Sob 02.03.03 Alimentação (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.03.03.01', 'Refeições e Pratos', 'Momentos de alimentação e comidas preparadas.', '02.03.03', ARRAY['café da manhã', 'almoço', 'janta', 'churrasco', 'carreteiro', 'chimarrão'], 'ativo'),
('02.03.03.02', 'Tipos de Alimento', 'Ingredientes e alimentos básicos.', '02.03.03', ARRAY['pão', 'carne', 'arroz', 'feijão', 'erva-mate', 'farinha', 'queijo'], 'ativo');

-- Sob 02.03.04 Vestuário e Acessórios (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.03.04.01', 'Roupas', 'Peças de vestuário.', '02.03.04', ARRAY['camisa', 'calça', 'vestido', 'saia', 'bombacha', 'pala', 'poncho'], 'ativo'),
('02.03.04.02', 'Calçados e Acessórios', 'Sapatos e adornos pessoais.', '02.03.04', ARRAY['bota', 'sapato', 'chapéu', 'cinto', 'lenço', 'guaiaca', 'esporas'], 'ativo');

-- Sob 02.04.01 Festas e Celebrações (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.04.01.01', 'Tipos de Festa', 'Eventos sociais e comemorações.', '02.04.01', ARRAY['aniversário', 'baile', 'fandango', 'rodeio', 'quermesse', 'casamento'], 'ativo'),
('02.04.01.02', 'Elementos de Festa', 'Componentes e atividades presentes em festas.', '02.04.01', ARRAY['música', 'dança', 'comida', 'bebida', 'presente', 'convite'], 'ativo');

-- Sob 02.04.02 Esportes e Jogos (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.04.02.01', 'Esportes', 'Competições e atividades físicas organizadas.', '02.04.02', ARRAY['futebol', 'vôlei', 'corrida de cavalo', 'gineteada', 'laço', 'rodeio'], 'ativo'),
('02.04.02.02', 'Jogos de Habilidade/Sorte', 'Jogos de mesa e entretenimento.', '02.04.02', ARRAY['baralho', 'bocha', 'truco', 'xadrez', 'bilhar', 'dominó'], 'ativo');

-- Sob 02.04.03 Hobbies e Passatempos (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.04.03.01', 'Atividades Manuais', 'Trabalhos artesanais e manuais de lazer.', '02.04.03', ARRAY['artesanato', 'costura', 'marcenaria', 'tricô', 'bordado'], 'ativo'),
('02.04.03.02', 'Atividades ao Ar Livre', 'Lazer em contato com a natureza.', '02.04.03', ARRAY['pesca', 'caça', 'caminhada', 'acampamento', 'cavalgar'], 'ativo');

-- Sob 02.05.01 Comunicação e Linguagem (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.05.01.01', 'Atos de Fala', 'Verbos e ações de comunicação verbal.', '02.05.01', ARRAY['falar', 'conversar', 'perguntar', 'contar', 'gritar', 'sussurrar', 'cantar'], 'ativo'),
('02.05.01.02', 'Formas de Escrita', 'Gêneros textuais e tipos de documentos.', '02.05.01', ARRAY['carta', 'livro', 'poema', 'bilhete', 'jornal', 'documento'], 'ativo');

-- Sob 02.05.02 Arte e Expressão Cultural (3 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.05.02.01', 'Música', 'Instrumentos, gêneros e elementos musicais.', '02.05.02', ARRAY['viola', 'gaita', 'canção', 'melodia', 'ritmo', 'milonga', 'vanera'], 'ativo'),
('02.05.02.02', 'Literatura: Poesia', 'Formas e elementos poéticos.', '02.05.02', ARRAY['verso', 'estrofe', 'rima', 'haikai', 'pajada', 'trova'], 'ativo'),
('02.05.02.03', 'Literatura: Prosa', 'Formas narrativas em prosa.', '02.05.02', ARRAY['conto', 'lenda', 'romance', 'crônica', 'fábula'], 'ativo');

-- Sob 02.05.03 Conhecimento e Crenças (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.05.03.01', 'Educação e Aprendizado', 'Ensino, estudo e aquisição de conhecimento.', '02.05.03', ARRAY['estudar', 'aprender', 'ensinar', 'escola', 'universidade', 'professor'], 'ativo'),
('02.05.03.02', 'Religião e Espiritualidade', 'Crenças, práticas religiosas e espirituais.', '02.05.03', ARRAY['fé', 'reza', 'promessa', 'alma', 'Deus', 'santo', 'igreja'], 'ativo');

-- Sob 02.06.01 Meios de Transporte (2 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.06.01.01', 'Transporte Terrestre', 'Veículos e animais terrestres.', '02.06.01', ARRAY['carro', 'ônibus', 'trem', 'carroça', 'cavalo', 'bicicleta', 'mula'], 'ativo'),
('02.06.01.02', 'Transporte Aquático/Aéreo', 'Veículos aquáticos e aéreos.', '02.06.01', ARRAY['barco', 'navio', 'canoa', 'balsa', 'avião'], 'ativo');

-- Sob 02.06.02 Infraestrutura Viária (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.06.02.01', 'Vias', 'Caminhos e estruturas de passagem.', '02.06.02', ARRAY['estrada', 'rua', 'caminho', 'trilha', 'atalho', 'ponte', 'porteira'], 'ativo');

-- Sob 02.06.03 Ações de Deslocamento (1 N4)
INSERT INTO semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status) VALUES
('02.06.03.01', 'Movimento', 'Verbos que indicam deslocamento.', '02.06.03', ARRAY['andar', 'correr', 'caminhar', 'viajar', 'cavalgar', 'passear', 'partir', 'chegar'], 'ativo');

-- FASE 6: Recalcular hierarquia completa
SELECT calculate_tagset_hierarchy();

-- VALIDAÇÃO FINAL
DO $$
DECLARE
  total_inseridos INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_inseridos FROM semantic_tagset WHERE codigo LIKE '02.%';
  RAISE NOTICE 'Total de categorias "Ser Humano e suas atividades": %', total_inseridos;
  
  IF total_inseridos < 58 THEN
    RAISE EXCEPTION 'Erro: apenas % categorias inseridas, esperado 58 ou mais', total_inseridos;
  END IF;
  
  RAISE NOTICE '✅ Hierarquia "Ser Humano e suas atividades" inserida com sucesso: % categorias', total_inseridos;
END $$;