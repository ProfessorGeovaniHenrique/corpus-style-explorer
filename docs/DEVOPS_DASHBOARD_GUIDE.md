# 📊 Guia do Dashboard de Métricas DevOps

## 📖 Visão Geral

O Dashboard de Métricas DevOps é uma interface web interativa que centraliza todas as informações sobre CI/CD, qualidade de código, testes e releases do projeto em tempo real.

## 🎯 Acesso

**URL:** `/devops-metrics`

**Como acessar:**
1. No header da aplicação, clique no botão "DevOps"
2. Ou navegue diretamente para `https://seu-dominio.com/devops-metrics`

## 📊 Componentes do Dashboard

### 1. Cards de Resumo (Top)

Quatro cards no topo mostram métricas-chave:

- **Taxa de Sucesso**: Porcentagem de workflows que passaram
- **Cobertura de Testes**: Porcentagem de testes aprovados
- **Tempo Médio CI**: Duração média dos workflows
- **Última Release**: Versão mais recente publicada

### 2. Workflow Status

**Localização:** Canto superior esquerdo

**O que mostra:**
- Status atual de cada workflow (Success, Failed, Running, Pending)
- Branch sendo executado
- Tempo desde a última execução
- Duração da execução
- Link direto para o workflow no GitHub Actions

**Cores dos status:**
- 🟢 Verde: Success
- 🔴 Vermelho: Failed
- 🟡 Amarelo: Running
- ⚪ Cinza: Pending

### 3. Métricas do Corpus

**Localização:** Canto superior direito

**O que mostra:**
- Palavras no Corpus
- Lemas Validados
- Domínios Semânticos

Para cada métrica:
- Valor atual vs. total
- Porcentagem de completude
- Variação percentual (tendência)
- Barra de progresso visual

### 4. Histórico de Testes

**Localização:** Centro, gráfico de linha grande

**O que mostra:**
- Evolução dos testes aprovados vs. falhados ao longo do tempo
- Linha temporal dos últimos 30 dias
- Taxa de aprovação atual vs. anterior
- Indicador de tendência (melhorando/piorando)

**Cores:**
- Azul (Primary): Testes aprovados
- Vermelho (Destructive): Testes que falharam

### 5. Cobertura de Testes

**Localização:** Inferior esquerdo

**O que mostra:**
- Gráfico de pizza com distribuição de testes por categoria
- Porcentagem total de cobertura
- Label qualitativo (Excelente, Boa, Aceitável, Precisa melhorar)
- Detalhamento por categoria abaixo do gráfico

**Níveis de qualidade:**
- ≥ 90%: Excelente (verde)
- ≥ 80%: Boa (amarelo)
- ≥ 70%: Aceitável (laranja)
- < 70%: Precisa melhorar (vermelho)

### 6. Timeline de Releases

**Localização:** Inferior direito

**O que mostra:**
- Histórico cronológico de todas as releases
- Versão, data, tipo (Major/Minor/Patch)
- Contagem de Breaking Changes, Features e Fixes
- Badge "Latest" para a versão mais recente
- Links diretos para as releases no GitHub

**Tipos de release:**
- 🔴 Major: Mudanças que quebram compatibilidade
- 🔵 Minor: Novas funcionalidades
- ⚪ Patch: Correções de bugs

## 🔄 Atualização de Dados

### Dados em Tempo Real

Atualmente, o dashboard usa dados mockados para demonstração. Para dados reais:

#### Opção 1: Via Arquivos Gerados pelo CI

Os scripts de CI/CD já geram arquivos JSON que podem ser consumidos:

```typescript
// public/badges/metrics.json
{
  "version": { "message": "v1.3.0" },
  "tests": { "message": "45/45 (100%)" },
  "coverage": { "message": "98%" },
  "corpus": { "message": "4250 palavras" },
  "lastUpdate": "2024-11-16T10:30:00Z"
}
```

**Implementação:**
```typescript
// No componente DevOpsMetrics.tsx
useEffect(() => {
  fetch('/badges/metrics.json')
    .then(res => res.json())
    .then(data => setBadgeMetrics(data));
}, []);
```

#### Opção 2: Via GitHub API

Consumir dados diretamente da API do GitHub:

```typescript
const GITHUB_API = 'https://api.github.com/repos/USER/REPO';

// Workflows
const workflows = await fetch(`${GITHUB_API}/actions/runs`).then(r => r.json());

// Releases
const releases = await fetch(`${GITHUB_API}/releases`).then(r => r.json());
```

#### Opção 3: Via Webhook/Endpoint Custom

Criar um endpoint Lovable Cloud que recebe dados do CI:

```typescript
// edge-functions/devops-metrics/index.ts
export default async (req: Request) => {
  const metrics = await fetchMetricsFromDatabase();
  return new Response(JSON.stringify(metrics));
};
```

### Frequência de Atualização

**Recomendações:**
- Workflow Status: A cada 30 segundos
- Métricas do Corpus: A cada 5 minutos
- Histórico de Testes: A cada hora
- Timeline de Releases: A cada 6 horas

## 🎨 Customização

### Modificar Cores

Edite os componentes individuais para ajustar o esquema de cores:

```typescript
// src/components/devops/WorkflowStatusCard.tsx
const statusConfig = {
  success: {
    color: "text-green-500",  // Personalizar
    bgColor: "bg-green-500/10",
  },
  // ...
};
```

### Adicionar Novas Métricas

1. Criar novo componente em `src/components/devops/`
2. Adicionar ao grid em `src/pages/DevOpsMetrics.tsx`
3. Passar dados mockados ou reais

Exemplo:

```typescript
// src/components/devops/DeploymentFrequencyCard.tsx
export function DeploymentFrequencyCard({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequência de Deploy</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Conteúdo */}
      </CardContent>
    </Card>
  );
}

// Adicionar em DevOpsMetrics.tsx
<DeploymentFrequencyCard data={deployData} />
```

### Modificar Layout

O grid usa Tailwind CSS para responsividade:

```typescript
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  {/* 1 coluna mobile, 2 tablet, 4 desktop */}
</div>

<div className="grid gap-6 lg:grid-cols-2">
  {/* 1 coluna mobile, 2 desktop */}
</div>

<div className="lg:col-span-2">
  {/* Ocupa 2 colunas no desktop */}
</div>
```

## 📱 Responsividade

O dashboard é totalmente responsivo:

- **Mobile (< 768px)**: 1 coluna, scroll vertical
- **Tablet (768px - 1024px)**: 2 colunas para cards principais
- **Desktop (> 1024px)**: 4 colunas para summary, 2 para gráficos

## 🔒 Controle de Acesso

Para restringir acesso ao dashboard:

### Opção 1: Auth Guard no Frontend

```typescript
// src/pages/DevOpsMetrics.tsx
import { useAuth } from "@/hooks/useAuth";

export default function DevOpsMetrics() {
  const { user, isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  // ... resto do código
}
```

### Opção 2: Route Protection

```typescript
// src/App.tsx
<Route
  path="/devops-metrics"
  element={
    <ProtectedRoute requiredRole="admin">
      <DevOpsMetrics />
    </ProtectedRoute>
  }
/>
```

## 📊 Exportação de Dados

### Adicionar Funcionalidade de Export

```typescript
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function exportMetrics() {
  const data = {
    workflows: workflowsData,
    tests: testHistoryData,
    // ...
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metrics-${new Date().toISOString()}.json`;
  a.click();
}

// No JSX
<Button onClick={exportMetrics}>
  <Download className="h-4 w-4 mr-2" />
  Exportar Métricas
</Button>
```

## 🐛 Troubleshooting

### Dashboard não carrega

**Verificar:**
- [ ] Rota está correta no `App.tsx`
- [ ] Importações dos componentes estão corretas
- [ ] Console do navegador para erros

### Dados não aparecem

**Verificar:**
- [ ] Arquivos JSON em `public/badges/` existem
- [ ] Permissões de CORS se consumir API externa
- [ ] Network tab para ver requisições

### Gráficos não renderizam

**Verificar:**
- [ ] Biblioteca `recharts` está instalada
- [ ] Dados têm formato correto
- [ ] Container tem altura definida

### Performance lenta

**Otimizações:**
- Usar `React.memo` nos componentes de gráfico
- Implementar virtualização para listas longas
- Reduzir frequência de atualização
- Usar lazy loading para gráficos pesados

## 📚 Referências

- [Recharts Documentation](https://recharts.org/)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [GitHub Actions API](https://docs.github.com/en/rest/actions)
- [DORA Metrics](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)

## 🔮 Roadmap

### Futuras Funcionalidades

- [ ] Filtros por período de tempo
- [ ] Comparação entre branches
- [ ] Alertas e notificações
- [ ] Integração com Slack/Discord
- [ ] Dashboard em tempo real com WebSockets
- [ ] Métricas DORA completas
- [ ] Análise de tendências com ML
- [ ] Exportação de relatórios em PDF

---

**Última atualização:** 2024  
**Versão do guia:** 1.0.0
