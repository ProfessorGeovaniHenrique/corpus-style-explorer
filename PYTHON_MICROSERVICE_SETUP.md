# 🐍 Python Microservice Setup - spaCy POS Tagger

Este documento contém instruções para deploy do microserviço Python que suporta Layer 2 (spaCy) do sistema de anotação POS.

## **Arquivos Necessários**

### **1. app.py**
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import spacy
from typing import List, Dict

# Carregar modelo pt_core_news_lg na inicialização
nlp = spacy.load("pt_core_news_lg")

app = FastAPI(title="Verso Austral - spaCy POS API")

class AnnotationRequest(BaseModel):
    tokens: List[str]
    fullText: str

@app.post("/annotate")
async def annotate_pos(req: AnnotationRequest):
    try:
        doc = nlp(req.fullText)
        
        annotations = []
        for word in req.tokens:
            # Buscar palavra no documento spaCy
            token = next((t for t in doc if t.text.lower() == word.lower()), None)
            
            if token:
                annotations.append({
                    "palavra": word,
                    "lema": token.lemma_,
                    "pos": token.pos_,
                    "posDetalhada": token.tag_,
                    "features": {
                        "tempo": token.morph.get("Tense", [""])[0],
                        "numero": token.morph.get("Number", [""])[0],
                        "pessoa": token.morph.get("Person", [""])[0],
                        "genero": token.morph.get("Gender", [""])[0],
                    },
                    "confidence": 0.85  # spaCy não retorna confiança
                })
            else:
                # Fallback se palavra não encontrada
                annotations.append({
                    "palavra": word,
                    "lema": word,
                    "pos": "UNKNOWN",
                    "posDetalhada": "UNKNOWN",
                    "features": {},
                    "confidence": 0.0
                })
        
        return {"annotations": annotations}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "model": "pt_core_news_lg"}

@app.get("/")
async def root():
    return {
        "service": "Verso Austral - spaCy POS Tagger",
        "version": "1.0.0",
        "endpoints": ["/annotate", "/health"]
    }
```

### **2. requirements.txt**
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
spacy==3.7.2
pt-core-news-lg @ https://github.com/explosion/spacy-models/releases/download/pt_core_news_lg-3.7.0/pt_core_news_lg-3.7.0-py3-none-any.whl
```

### **3. Procfile**
```
web: uvicorn app:app --host 0.0.0.0 --port $PORT
```

### **4. runtime.txt** (opcional)
```
python-3.11.6
```

---

## **📦 Deploy no Render.com (FREE TIER)**

### **Passo 1: Preparar Repositório**
1. Criar repositório GitHub público/privado
2. Adicionar arquivos: `app.py`, `requirements.txt`, `Procfile`
3. Commit e push

### **Passo 2: Criar Web Service**
1. Acessar [render.com](https://render.com)
2. Criar conta (grátis)
3. Dashboard → **New** → **Web Service**
4. Conectar repositório GitHub
5. Configurações:
   - **Name:** `verso-austral-spacy`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free (750h/mês)
6. **Create Web Service**

### **Passo 3: Aguardar Deploy (5-10 min)**
- Render irá instalar spaCy + modelo (pt_core_news_lg)
- Primeira build leva ~10min por causa do modelo (300MB)
- Builds subsequentes são mais rápidas (cache)

### **Passo 4: Obter URL**
- URL será: `https://verso-austral-spacy-XXXX.onrender.com`
- Exemplo: `https://verso-austral-spacy-a1b2.onrender.com`

---

## **🧪 Testar Microserviço**

### **Teste 1: Health Check**
```bash
curl https://verso-austral-spacy-XXXX.onrender.com/health
```

**Resposta esperada:**
```json
{"status": "healthy", "model": "pt_core_news_lg"}
```

### **Teste 2: Anotação POS**
```bash
curl -X POST https://verso-austral-spacy-XXXX.onrender.com/annotate \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": ["sou", "feliz", "estava", "caminhando"],
    "fullText": "eu sou feliz e estava caminhando"
  }'
```

**Resposta esperada:**
```json
{
  "annotations": [
    {
      "palavra": "sou",
      "lema": "ser",
      "pos": "AUX",
      "posDetalhada": "AUX",
      "features": {"tempo": "Pres", "pessoa": "1", "numero": "Sing"},
      "confidence": 0.85
    },
    ...
  ]
}
```

---

## **🔗 Configurar no Lovable**

### **Adicionar Secret no Supabase**
1. No projeto Lovable, ir em **Cloud** → **Secrets**
2. Adicionar novo secret:
   - **Name:** `SPACY_API_URL`
   - **Value:** `https://verso-austral-spacy-XXXX.onrender.com`
3. Salvar

### **Verificar Integração**
1. Ir para `/admin/semantic-tagset-validation`
2. Aba "🧪 Teste POS Layer 1"
3. Inserir texto de teste
4. Clicar "Anotar Texto"
5. Verificar badges:
   - 🧠 = Layer 1 (VA Grammar)
   - 🐍 = Layer 2 (spaCy)

---

## **📊 Monitoramento**

### **Logs do Render.com**
- Dashboard → Service → **Logs**
- Monitorar erros e latência

### **Métricas**
- **Uptime:** Render free tier: 99%+ (pode dormir após 15min inativo)
- **Cold start:** ~5-10s na primeira request após dormir
- **Latência normal:** 100-300ms

### **Limitações Free Tier**
- 750 horas/mês (suficiente para testes)
- Dorme após 15min sem uso
- 1 instância (sem redundância)

---

## **🚨 Troubleshooting**

### **Problema: Build falha**
**Solução:** Verificar logs de build no Render. Modelo pt_core_news_lg pode demorar.

### **Problema: 503 Service Unavailable**
**Solução:** Service pode estar dormindo (cold start). Aguardar 10s e tentar novamente.

### **Problema: Timeout no edge function**
**Solução:** 
- Verificar se `SPACY_API_URL` está configurado
- Verificar health check: `curl URL/health`
- Aumentar timeout em `spacy-annotator.ts` se necessário

### **Problema: Latência alta (>1s)**
**Solução:**
- Normal em cold start
- Considerar upgrade para plan pago (sem cold start)
- Otimizar batch processing

---

## **💰 Custos**

### **Free Tier (Render.com)**
- **Custo:** $0/mês
- **Limitações:** 750h/mês, cold start após 15min
- **Adequado para:** Desenvolvimento, MVP, testes

### **Upgrade (Opcional)**
- **Plan Starter:** $7/mês
- **Benefícios:** Sem cold start, 24/7 uptime, mais RAM
- **Quando considerar:** Produção com alto tráfego

---

## **✅ Checklist de Deploy**

- [ ] Repositório GitHub criado com arquivos Python
- [ ] Deploy no Render.com concluído
- [ ] Health check retornando `{"status": "healthy"}`
- [ ] Teste de anotação funcionando
- [ ] Secret `SPACY_API_URL` configurado no Lovable
- [ ] Interface de teste mostrando badges 🐍 spaCy
- [ ] Latência < 500ms para textos médios

---

## **📚 Recursos**

- [Render.com Docs](https://render.com/docs)
- [spaCy Docs](https://spacy.io/usage)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [pt_core_news_lg Model](https://spacy.io/models/pt#pt_core_news_lg)
