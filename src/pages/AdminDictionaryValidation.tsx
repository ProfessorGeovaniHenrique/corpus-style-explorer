import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MVPHeader } from '@/components/mvp/MVPHeader';
import { MVPFooter } from '@/components/mvp/MVPFooter';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Clock, AlertCircle, Zap, Keyboard } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDialectalLexicon } from '@/hooks/useDialectalLexicon';
import { useBackendLexicon, type LexiconEntry } from '@/hooks/useBackendLexicon';
import { ValidationInterface } from '@/components/advanced/ValidationInterface';
import { BatchValidationDialog } from '@/components/advanced/lexicon-status/BatchValidationDialog';
import { ClearDictionariesCard } from '@/components/advanced/lexicon-status/ClearDictionariesCard';
import { useLexiconStats } from '@/hooks/useLexiconStats';
import { VerbeteCard } from '@/components/validation/VerbeteCard';
import { useValidationShortcuts } from '@/hooks/useValidationShortcuts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DICTIONARY_CONFIG: Record<string, { 
  displayName: string; 
  table: 'dialectal' | 'gutenberg'; 
  volumeFilter?: string;
}> = {
  'gaucho_unificado': { 
    displayName: 'Gaúcho Unificado',
    table: 'dialectal',
    volumeFilter: 'I'
  },
  'rocha_pombo': { 
    displayName: 'Rocha Pombo (ABL)',
    table: 'dialectal',
    volumeFilter: 'II'
  },
  'gutenberg': { 
    displayName: 'Gutenberg',
    table: 'gutenberg'
  },
};

export default function AdminDictionaryValidation() {
  const { tipo } = useParams<{ tipo: string }>();
  const config = DICTIONARY_CONFIG[tipo || ''];
  
  const [posFilter, setPosFilter] = useState<string>('all');
  const [validationFilter, setValidationFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const { data: lexiconStats, refetch: refetchStats } = useLexiconStats();

  const ITEMS_PER_PAGE = 24;

  // Buscar dados baseado na tabela configurada
  const { entries: dialectalEntries, isLoading: dialectalLoading, refetch: dialectalRefetch } = useDialectalLexicon({
    searchTerm: searchTerm || undefined,
  });

  const { lexicon: gutenbergEntries, isLoading: gutenbergLoading, refetch: gutenbergRefetch } = useBackendLexicon({
    table: 'gutenberg_lexicon',
    searchTerm: searchTerm || undefined,
  });

  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <MVPHeader />
        <div className="container mx-auto py-8 px-4">
          <AdminBreadcrumb currentPage="Validação de Dicionário" />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Dicionário não encontrado</CardTitle>
              <CardDescription>O tipo de dicionário solicitado não existe.</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <MVPFooter />
      </div>
    );
  }

  const isLoading = config.table === 'dialectal' ? dialectalLoading : gutenbergLoading;
  const allEntries = config.table === 'dialectal' ? dialectalEntries : gutenbergEntries;
  const refetch = config.table === 'dialectal' ? dialectalRefetch : gutenbergRefetch;

  // Filtrar por volume se aplicável
  const volumeEntries = config.volumeFilter 
    ? allEntries.filter((e: any) => e.volume_fonte === config.volumeFilter)
    : allEntries;

  // Aplicar filtros adicionais
  const filteredEntries = volumeEntries.filter((entry: any) => {
    if (posFilter !== 'all' && entry.classe_gramatical !== posFilter) return false;
    if (validationFilter === 'validated' && !entry.validado_humanamente && !entry.validado) return false;
    if (validationFilter === 'pending' && (entry.validado_humanamente || entry.validado)) return false;
    return true;
  });

  const validatedCount = volumeEntries.filter((e: any) => e.validado_humanamente || e.validado).length;
  const pendingCount = volumeEntries.length - validatedCount;
  const validationRate = volumeEntries.length > 0 
    ? ((validatedCount / volumeEntries.length) * 100).toFixed(2) 
    : '0.00';

  const pendingHighConfidenceCount = volumeEntries.filter((e: any) => 
    !e.validado_humanamente && 
    !e.validado && 
    (e.confianca_extracao || e.confianca || 0) >= 0.9
  ).length;

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleValidate = (entry: any) => {
    // Adaptar formato para ValidationInterface
    const adaptedEntry = {
      id: entry.id,
      palavra: entry.verbete || entry.palavra,
      lema: entry.verbete_normalizado || entry.lema,
      pos: entry.classe_gramatical || entry.pos || 'unknown',
      tagset: null,
      tagset_codigo: null,
      prosody: 0,
      confianca: entry.confianca_extracao || entry.confianca,
      validado: entry.validado_humanamente || entry.validado
    };
    setSelectedEntry(adaptedEntry);
    setValidationOpen(true);
  };

  const handleValidationSuccess = () => {
    refetch();
    refetchStats();
    setValidationOpen(false);
    setSelectedEntry(null);
  };

  const handleApprove = async (id: string) => {
    try {
      const tableName = config.table === 'dialectal' ? 'dialectal_lexicon' : 'gutenberg_lexicon';
      await supabase
        .from(tableName)
        .update({ validado_humanamente: true })
        .eq('id', id);
      
      toast.success('Verbete aprovado com sucesso');
      refetch();
      refetchStats();
    } catch (error: any) {
      toast.error(`Erro ao aprovar: ${error.message}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const tableName = config.table === 'dialectal' ? 'dialectal_lexicon' : 'gutenberg_lexicon';
      await supabase
        .from(tableName)
        .update({ 
          validado_humanamente: false,
          validation_status: 'rejected' 
        })
        .eq('id', id);
      
      toast.success('Verbete rejeitado');
      refetch();
      refetchStats();
    } catch (error: any) {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    }
  };

  const selectedIndex = selectedEntryId 
    ? paginatedEntries.findIndex((e: any) => e.id === selectedEntryId)
    : -1;

  useValidationShortcuts({
    enabled: !validationOpen,
    onApprove: selectedEntryId ? () => handleApprove(selectedEntryId) : undefined,
    onReject: selectedEntryId ? () => handleReject(selectedEntryId) : undefined,
    onEdit: selectedEntryId 
      ? () => handleValidate(paginatedEntries.find((e: any) => e.id === selectedEntryId))
      : undefined,
    onNext: () => {
      if (selectedIndex < paginatedEntries.length - 1) {
        setSelectedEntryId(paginatedEntries[selectedIndex + 1].id);
      } else if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
        setSelectedEntryId(null);
      }
    },
    onPrevious: () => {
      if (selectedIndex > 0) {
        setSelectedEntryId(paginatedEntries[selectedIndex - 1].id);
      } else if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
        setSelectedEntryId(null);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MVPHeader />
      
      <div className="container mx-auto py-8 px-4">
        <AdminBreadcrumb currentPage={`Validação ${config.displayName}`} />

        <div className="space-y-6 mt-6">
          {/* Estatísticas com Progresso */}
          <Card>
            <CardHeader>
              <CardTitle>Progresso de Validação</CardTitle>
              <CardDescription>
                Acompanhe o andamento da validação do dicionário {config.displayName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso Global</span>
                  <span className="font-medium">{validationRate}%</span>
                </div>
                <Progress value={parseFloat(validationRate)} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{validatedCount} validados</span>
                  <span>{pendingCount} pendentes</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold">{volumeEntries.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{validatedCount}</div>
                  <div className="text-xs text-muted-foreground">Validados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validação em Lote Destacada */}
          {tipo && !['rocha_pombo'].includes(tipo) && pendingHighConfidenceCount > 0 && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Validação Automática em Lote</CardTitle>
                      <CardDescription>
                        Valide automaticamente verbetes com alta confiança (≥90%)
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {pendingHighConfidenceCount} elegíveis
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>{pendingHighConfidenceCount} verbetes</strong> atendem aos critérios de validação automática.
                    Isso representará <strong>{((pendingHighConfidenceCount / pendingCount) * 100).toFixed(0)}%</strong> dos verbetes pendentes.
                  </AlertDescription>
                </Alert>
                
                <BatchValidationDialog 
                  batchSize={pendingHighConfidenceCount} 
                  dictionaryType={config.table}
                  onSuccess={handleValidationSuccess}
                  trigger={
                    <Button size="lg" className="w-full gap-2">
                      <Zap className="h-5 w-5" />
                      Validar Todos Elegíveis ({pendingHighConfidenceCount})
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* Card de Limpeza */}
          <ClearDictionariesCard 
            stats={lexiconStats}
            onSuccess={() => {
              refetchStats();
              refetch();
            }}
          />

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Busca</CardTitle>
              <CardDescription>Refine a lista de verbetes para validação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Classe Gramatical</label>
                  <Select value={posFilter} onValueChange={setPosFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="s.m.">s.m.</SelectItem>
                      <SelectItem value="s.f.">s.f.</SelectItem>
                      <SelectItem value="fraseol.">fraseol.</SelectItem>
                      <SelectItem value="v.t.d.">v.t.d.</SelectItem>
                      <SelectItem value="adj.">adj.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status Validação</label>
                  <Select value={validationFilter} onValueChange={setValidationFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="validated">Validados</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar Verbete</label>
                  <Input
                    placeholder="Digite para buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Atalhos de Teclado */}
              <Alert>
                <Keyboard className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Atalhos:</strong> A = Aprovar | R = Rejeitar | E = Editar | ↑↓ = Navegar
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Grade de Cards de Verbetes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Verbetes para Validação</CardTitle>
                  <CardDescription>
                    {filteredEntries.length} verbete(s) encontrado(s) | Página {currentPage} de {totalPages}
                  </CardDescription>
                </div>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhum verbete encontrado com os filtros selecionados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedEntries.map((entry: any) => (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntryId(entry.id)}
                    >
                      <VerbeteCard
                        entry={entry as LexiconEntry}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onEdit={handleValidate}
                        isSelected={selectedEntryId === entry.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Validação */}
      {selectedEntry && (
        <ValidationInterface
          entry={selectedEntry}
          open={validationOpen}
          onOpenChange={setValidationOpen}
          onSuccess={handleValidationSuccess}
        />
      )}

      <MVPFooter />
    </div>
  );
}
