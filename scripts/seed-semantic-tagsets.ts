/**
 * Script de Seed - Taxonomia Semântica Base
 * 
 * Baseado em McArthur (1981) e adaptado para cultura brasileira (gaúcha/nordestina)
 * Estrutura hierárquica em 4 níveis: 01 → 01.01 → 01.01.01 → 01.01.01.01
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface TagsetSeed {
  codigo: string;
  nome: string;
  descricao: string;
  categoria_pai: string | null;
  exemplos: string[];
  status: string;
}

const TAXONOMIA_BASE: TagsetSeed[] = [
  // =============================================
  // 01. NATUREZA E MEIO AMBIENTE
  // =============================================
  {
    codigo: '01',
    nome: 'Natureza e Meio Ambiente',
    descricao: 'Elementos do mundo natural, flora, fauna, geografia e fenômenos climáticos',
    categoria_pai: null,
    exemplos: ['céu', 'terra', 'água', 'planta', 'bicho'],
    status: 'ativo'
  },
  {
    codigo: '01.01',
    nome: 'Fauna',
    descricao: 'Animais domésticos, selvagens, aves, répteis, insetos',
    categoria_pai: '01',
    exemplos: ['cavalo', 'boi', 'cachorro', 'passarinho', 'cobra'],
    status: 'ativo'
  },
  {
    codigo: '01.02',
    nome: 'Flora',
    descricao: 'Árvores, flores, plantas, vegetação',
    categoria_pai: '01',
    exemplos: ['árvore', 'flor', 'mato', 'capim', 'cerejeira'],
    status: 'ativo'
  },
  {
    codigo: '01.03',
    nome: 'Geografia',
    descricao: 'Elementos geográficos: rios, montanhas, planícies, caminhos',
    categoria_pai: '01',
    exemplos: ['rio', 'serra', 'campo', 'estrada', 'pampa'],
    status: 'ativo'
  },
  {
    codigo: '01.04',
    nome: 'Clima e Fenômenos Naturais',
    descricao: 'Tempo, estações, fenômenos atmosféricos',
    categoria_pai: '01',
    exemplos: ['chuva', 'sol', 'vento', 'neblina', 'seca'],
    status: 'ativo'
  },

  // =============================================
  // 02. ATIVIDADES HUMANAS
  // =============================================
  {
    codigo: '02',
    nome: 'Atividades Humanas',
    descricao: 'Ações e práticas realizadas por pessoas no cotidiano',
    categoria_pai: null,
    exemplos: ['trabalhar', 'andar', 'falar', 'comer', 'dormir'],
    status: 'ativo'
  },
  {
    codigo: '02.01',
    nome: 'Trabalho Rural e Campeiro',
    descricao: 'Atividades relacionadas ao campo, pecuária, agricultura',
    categoria_pai: '02',
    exemplos: ['domar', 'laçar', 'arar', 'plantar', 'colher'],
    status: 'ativo'
  },
  {
    codigo: '02.02',
    nome: 'Lazer e Entretenimento',
    descricao: 'Diversões, festas, jogos, brincadeiras',
    categoria_pai: '02',
    exemplos: ['dançar', 'cantar', 'brincar', 'festejar', 'jogar'],
    status: 'ativo'
  },
  {
    codigo: '02.03',
    nome: 'Transporte e Locomoção',
    descricao: 'Formas de deslocamento e meios de transporte',
    categoria_pai: '02',
    exemplos: ['cavalgar', 'andar', 'viajar', 'carrear', 'tropear'],
    status: 'ativo'
  },
  {
    codigo: '02.04',
    nome: 'Comunicação',
    descricao: 'Atos de fala, conversação, narração',
    categoria_pai: '02',
    exemplos: ['contar', 'conversar', 'gritar', 'sussurrar', 'cantar'],
    status: 'ativo'
  },

  // =============================================
  // 03. SENTIMENTOS E EMOÇÕES
  // =============================================
  {
    codigo: '03',
    nome: 'Sentimentos e Emoções',
    descricao: 'Estados emocionais e afetivos do ser humano',
    categoria_pai: null,
    exemplos: ['amor', 'saudade', 'alegria', 'tristeza', 'raiva'],
    status: 'ativo'
  },
  {
    codigo: '03.01',
    nome: 'Alegria e Felicidade',
    descricao: 'Emoções positivas, contentamento, júbilo',
    categoria_pai: '03',
    exemplos: ['alegre', 'feliz', 'contente', 'animado', 'festeiro'],
    status: 'ativo'
  },
  {
    codigo: '03.02',
    nome: 'Tristeza e Melancolia',
    descricao: 'Sentimentos de pesar, luto, solidão',
    categoria_pai: '03',
    exemplos: ['triste', 'saudade', 'choroso', 'sofrido', 'amargurado'],
    status: 'ativo'
  },
  {
    codigo: '03.03',
    nome: 'Amor e Afeto',
    descricao: 'Sentimentos românticos, carinho, ternura',
    categoria_pai: '03',
    exemplos: ['amar', 'querer', 'gostar', 'paixão', 'carinho'],
    status: 'ativo'
  },
  {
    codigo: '03.04',
    nome: 'Raiva e Irritação',
    descricao: 'Sentimentos de ira, revolta, insatisfação',
    categoria_pai: '03',
    exemplos: ['bravo', 'zangado', 'irritado', 'revoltado', 'furioso'],
    status: 'ativo'
  },

  // =============================================
  // 04. OBJETOS E ARTEFATOS
  // =============================================
  {
    codigo: '04',
    nome: 'Objetos e Artefatos',
    descricao: 'Instrumentos, ferramentas, equipamentos e objetos materiais',
    categoria_pai: null,
    exemplos: ['ferramenta', 'utensílio', 'equipamento', 'instrumento'],
    status: 'ativo'
  },
  {
    codigo: '04.01',
    nome: 'Equipamentos de Montaria',
    descricao: 'Arreios, selas, estribos e equipamentos para cavalgar',
    categoria_pai: '04',
    exemplos: ['laço', 'boleadeira', 'xergão', 'pelego', 'arreio'],
    status: 'ativo'
  },
  {
    codigo: '04.02',
    nome: 'Ferramentas de Trabalho Rural',
    descricao: 'Implementos para trabalho no campo',
    categoria_pai: '04',
    exemplos: ['enxada', 'foice', 'machado', 'facão', 'cusco'],
    status: 'ativo'
  },
  {
    codigo: '04.03',
    nome: 'Instrumentos Musicais',
    descricao: 'Instrumentos para fazer música',
    categoria_pai: '04',
    exemplos: ['gaita', 'violão', 'acordeão', 'zabumba', 'pandeiro'],
    status: 'ativo'
  },

  // =============================================
  // 05. VESTUÁRIO E INDUMENTÁRIA
  // =============================================
  {
    codigo: '05',
    nome: 'Vestuário e Indumentária',
    descricao: 'Roupas, acessórios e modos de vestir',
    categoria_pai: null,
    exemplos: ['roupa', 'chapéu', 'calça', 'camisa', 'vestido'],
    status: 'ativo'
  },
  {
    codigo: '05.01',
    nome: 'Vestuário Tradicional',
    descricao: 'Roupas típicas e tradicionais',
    categoria_pai: '05',
    exemplos: ['bombacha', 'poncho', 'gibão', 'alpargata', 'lenço'],
    status: 'ativo'
  },
  {
    codigo: '05.02',
    nome: 'Acessórios',
    descricao: 'Complementos do vestuário',
    categoria_pai: '05',
    exemplos: ['chapéu', 'lenço', 'cinto', 'bota', 'esporas'],
    status: 'ativo'
  },

  // =============================================
  // 06. ALIMENTAÇÃO
  // =============================================
  {
    codigo: '06',
    nome: 'Alimentação',
    descricao: 'Comidas, bebidas e práticas alimentares',
    categoria_pai: null,
    exemplos: ['comida', 'bebida', 'refeição', 'alimento'],
    status: 'ativo'
  },
  {
    codigo: '06.01',
    nome: 'Bebidas',
    descricao: 'Bebidas quentes, frias, alcoólicas e não alcoólicas',
    categoria_pai: '06',
    exemplos: ['chimarrão', 'café', 'cachaça', 'água', 'vinho'],
    status: 'ativo'
  },
  {
    codigo: '06.02',
    nome: 'Pratos e Preparações',
    descricao: 'Comidas preparadas e pratos típicos',
    categoria_pai: '06',
    exemplos: ['churrasco', 'carreteiro', 'buchada', 'feijão', 'arroz'],
    status: 'ativo'
  },

  // =============================================
  // 07. MÚSICA E DANÇA
  // =============================================
  {
    codigo: '07',
    nome: 'Música e Dança',
    descricao: 'Ritmos, danças, estilos musicais',
    categoria_pai: null,
    exemplos: ['música', 'dança', 'ritmo', 'canção'],
    status: 'ativo'
  },
  {
    codigo: '07.01',
    nome: 'Ritmos e Estilos',
    descricao: 'Gêneros musicais e estilos de dança',
    categoria_pai: '07',
    exemplos: ['vaneira', 'milonga', 'forró', 'baião', 'xote'],
    status: 'ativo'
  },

  // =============================================
  // 08. TEMPO
  // =============================================
  {
    codigo: '08',
    nome: 'Tempo',
    descricao: 'Temporalidade, ciclos, passagem do tempo',
    categoria_pai: null,
    exemplos: ['ontem', 'hoje', 'amanhã', 'sempre', 'nunca'],
    status: 'ativo'
  },
  {
    codigo: '06.01',
    nome: 'Passado',
    descricao: 'Referências a tempo pretérito, memória',
    categoria_pai: '06',
    exemplos: ['antigamente', 'outrora', 'antes', 'passado', 'lembrança'],
    status: 'ativo'
  },
  {
    codigo: '06.02',
    nome: 'Presente',
    descricao: 'Tempo atual, momento presente',
    categoria_pai: '06',
    exemplos: ['agora', 'hoje', 'atualmente', 'neste instante'],
    status: 'ativo'
  },
];

async function seedTagsets() {
  console.log('🌱 Iniciando seed de tagsets semânticos...\n');

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const tagset of TAXONOMIA_BASE) {
    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('semantic_tagset')
        .select('codigo')
        .eq('codigo', tagset.codigo)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️  ${tagset.codigo} - ${tagset.nome} (já existe)`);
        skipped++;
        continue;
      }

      // Inserir novo tagset
      const { error } = await supabase
        .from('semantic_tagset')
        .insert({
          codigo: tagset.codigo,
          nome: tagset.nome,
          descricao: tagset.descricao,
          categoria_pai: tagset.categoria_pai,
          exemplos: tagset.exemplos,
          status: tagset.status,
          aprovado_em: new Date().toISOString(),
          aprovado_por: '00000000-0000-0000-0000-000000000000', // System user
        });

      if (error) throw error;

      console.log(`✅ ${tagset.codigo} - ${tagset.nome}`);
      inserted++;
    } catch (err) {
      console.error(`❌ Erro ao inserir ${tagset.codigo}:`, err);
      errors++;
    }
  }

  console.log('\n📊 Resumo do Seed:');
  console.log(`   ✅ Inseridos: ${inserted}`);
  console.log(`   ⏭️  Ignorados: ${skipped}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📦 Total: ${TAXONOMIA_BASE.length}`);
}

// Executar seed
seedTagsets().catch(console.error);
