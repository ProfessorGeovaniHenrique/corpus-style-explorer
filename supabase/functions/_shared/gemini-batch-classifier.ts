/**
 * Batch classification with Gemini Flash for semantic domains
 */

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const GEMINI_MODEL = 'google/gemini-2.5-flash';

interface WordToClassify {
  palavra: string;
  lema?: string;
  pos?: string;
}

interface ClassificationResult {
  palavra: string;
  lema?: string;
  pos?: string;
  tagset_codigo: string;           // DS primário (mais provável no contexto)
  tagsets_alternativos?: string[]; // DSs secundários quando polissêmico
  is_polysemous?: boolean;         // Indica polissemia
  confianca: number;
}

/**
 * Remove markdown code blocks from Gemini response
 * Handles: ```json ... ```, ``` ... ```, or raw JSON
 */
function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  
  // Remove ```json ou ``` do início
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  
  // Remove ``` do final
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  return cleaned.trim();
}

export async function classifyBatchWithGemini(
  words: WordToClassify[],
  logger: any
): Promise<ClassificationResult[]> {
  
  const prompt = buildBatchPrompt(words);

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2, // Baixa para consistência
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[gemini-batch] API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[gemini-batch] Raw response:', JSON.stringify(data).substring(0, 500));
    
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('[gemini-batch] Empty content in response:', data);
      throw new Error('Empty response from Gemini');
    }

    // Parse JSON response
    console.log('[gemini-batch] Parsing content:', content.substring(0, 300));
    const cleanedContent = cleanJsonResponse(content);
    console.log('[gemini-batch] Cleaned content:', cleanedContent.substring(0, 200));
    const parsed = JSON.parse(cleanedContent);
    
    console.log('[gemini-batch] Successfully classified', parsed.classifications?.length || 0, 'words');
    return parsed.classifications || [];

  } catch (error) {
    console.error('[gemini-batch] Classification error:', error);
    logger.error('Batch classification error', error as Error);
    
    // Fallback: retornar NC para todas
    return words.map(w => ({
      palavra: w.palavra,
      lema: w.lema,
      pos: w.pos,
      tagset_codigo: 'NC',
      tagsets_alternativos: [],
      is_polysemous: false,
      confianca: 0.50
    }));
  }
}

function getSystemPrompt(): string {
  return `Você é um especialista em classificação semântica para o projeto Verso Austral.
Classifique cada palavra no domínio semântico mais apropriado usando os códigos fornecidos.

IMPORTANTE - POLISSEMIA:
- Se a palavra tem múltiplos sentidos (ex: "manga", "banco", "vela"), identifique TODOS os DSs possíveis
- "tagset_codigo" deve ser o DS mais provável NO CONTEXTO
- "tagsets_alternativos" deve conter os outros DSs possíveis (array)
- "is_polysemous" deve ser true quando há múltiplos sentidos

Retorne APENAS um JSON válido no formato:
{
  "classifications": [
    {
      "palavra": "banco",
      "tagset_codigo": "OA",
      "tagsets_alternativos": ["AP", "EL"],
      "is_polysemous": true,
      "confianca": 0.85
    }
  ]
}`;
}

function buildBatchPrompt(words: WordToClassify[]): string {
  const wordsList = words.map((w, i) => 
    `${i + 1}. ${w.palavra}${w.lema ? ` (lema: ${w.lema})` : ''}${w.pos ? ` [${w.pos}]` : ''}`
  ).join('\n');

  return `Classifique as seguintes palavras nos domínios semânticos:

**14 DOMÍNIOS SEMÂNTICOS N1:**
- AB (Abstrações): ideias abstratas, conceitos filosóficos, valores morais
- AC (Ações e Processos): verbos de ação física concreta (andar, pegar, construir, olhar, falar)
- AP (Atividades e Práticas Sociais): trabalho, alimentação, vestuário, lazer, transporte
- CC (Cultura e Conhecimento): arte, educação, religião, ciência, comunicação
- EL (Estruturas e Lugares): construções, locais físicos, espaços arquitetônicos
- EQ (Estados, Qualidades e Medidas): adjetivos, características, tempo, dimensões
- MG (Marcadores Gramaticais): artigos, preposições, conjunções, palavras funcionais
- NA (Natureza e Paisagem): flora, fauna, clima, geografia, elementos naturais
- NC (Não Classificado): use apenas se nenhum domínio se aplica
- OA (Objetos e Artefatos): ferramentas, utensílios, equipamentos, vestimenta
- SB (Saúde e Bem-Estar): doenças humanas/animais, tratamentos, bem-estar, saúde mental
- SE (Sentimentos): amor, saudade, alegria, tristeza, emoções
- SH (Indivíduo): pessoa, corpo humano, características humanas, identidade
- SP (Sociedade e Organização Política): governo, lei, relações sociais, política

**SUBDOMÍNIOS IMPORTANTES N2:**
- AC.MD (Movimento): andar, correr, pular, sentar, virar, saltar
- AC.MI (Manipulação): pegar, segurar, empurrar, amarrar, abrir, fechar
- AC.TR (Transformação): construir, quebrar, cortar, limpar, escrever, pintar
- AC.PS (Percepção): olhar, ver, escutar, cheirar, provar, sentir
- AC.EC (Expressão): falar, cantar, gritar, acenar, abraçar, beijar
- AP.TRA (Trabalho/Economia): plantar, colher, comprar, vender, tropeiro, médico
- AP.ALI (Alimentação): cozinhar, churrasco, chimarrão, mate, cuia
- AP.VES (Vestuário): vestir, costurar, bombacha, bota, poncho
- AP.LAZ (Lazer/Esportes): festa, fandango, rodeio, futebol, dança
- CC.ART (Arte): música, poesia, pintura, dança, literatura
- CC.REL (Religiosidade): Deus, fé, alma, reza, igreja
- SB.DOE (Doenças): gripe, diabetes, febre, dor, ferida, cinomose
- SB.TRA (Tratamentos): remédio, cirurgia, hospital, vacina, vermífugo
- SB.05 (Saúde Animal - Veterinária): veterinário, castração, febre aftosa, raiva
  - SB.05.01 (Doenças Animais): cinomose, raiva, febre aftosa, parvovirose
  - SB.05.02 (Tratamentos Veterinários): vermífugo, castração, vacinação animal
  - SB.05.03 (Sistema de Saúde Animal): veterinário, clínica veterinária, zootecnista
- SP.GOV (Governo): democracia, ministério, eleição, imposto
- SP.LEI (Lei/Justiça): lei, julgamento, crime, polícia, prisão

**IMPORTANTE - SAÚDE ANIMAL:**
Use SB ou SB.05 para termos veterinários (veterinário, vermífugo, castração de animais, doenças animais como cinomose, raiva, febre aftosa).

PALAVRAS:
${wordsList}

Retorne JSON válido com a classificação de cada palavra.`;
}
