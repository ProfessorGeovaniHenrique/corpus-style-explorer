import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VisualWordNode } from '@/data/types/threeVisualization.types';
import { kwicDataMap } from '@/data/mockup/kwic';
import { Sparkles, BarChart3, Network, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInteractivityStore, selectModal } from '@/store/interactivityStore';
import { motion, AnimatePresence } from 'framer-motion';

export function DetailModal() {
  const { isOpen, node } = useInteractivityStore(selectModal);
  const { closeModal } = useInteractivityStore();
  
  if (!node || node.type !== 'word') return null;
  
  const wordNode = node as VisualWordNode;
  const concordances = kwicDataMap[node.label] || [];
  
  // Parsear fonte (formato: "Artista - Música")
  const parseSource = (source: string) => {
    const parts = source.split(' - ');
    return {
      artist: parts[0] || '',
      song: parts[1] || source,
    };
  };
  
  // Exportar dados como CSV
  const handleExportCSV = () => {
    const headers = ['Artista', 'Música', 'Contexto Esquerdo', 'Palavra-Chave', 'Contexto Direito'];
    const rows = concordances.map(c => {
      const { artist, song } = parseSource(c.source);
      return [artist, song, c.leftContext, c.keyword, c.rightContext];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kwic_${node.label}.csv`;
    link.click();
  };
  
  // Exportar dados como JSON
  const handleExportJSON = () => {
    const data = {
      word: node.label,
      domain: wordNode.domain,
      stats: {
        rawFrequency: wordNode.rawData.rawFrequency,
        normalizedFrequency: wordNode.rawData.normalizedFrequency,
        prosody: wordNode.prosody,
      },
      concordances,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analysis_${node.label}.json`;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ color: node.color }}
            >
              {node.label}
            </motion.span>
            <Badge style={{ backgroundColor: `${node.color}33`, color: node.color }}>
              {wordNode.domain}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Análise linguística detalhada e concordâncias (KWIC)
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="kwic" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kwic" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              KWIC ({concordances.length})
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="related" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Relacionadas
            </TabsTrigger>
          </TabsList>

          {/* Tab KWIC */}
          <TabsContent value="kwic" className="flex-1 overflow-y-auto space-y-3 mt-4">
            <div className="flex justify-end gap-2 mb-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportCSV}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportJSON}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                JSON
              </Button>
            </div>
            
            <AnimatePresence mode="popLayout">
              {concordances.map((conc, idx) => {
                const { artist, song } = parseSource(conc.source);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    className="bg-slate-800/30 rounded-lg p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2 text-sm text-slate-400">
                      <span className="font-semibold">{artist}</span>
                      <span>•</span>
                      <span className="italic">{song}</span>
                      <ExternalLink className="w-3 h-3 ml-auto cursor-pointer hover:text-cyan-400" />
                    </div>
                  <div className="font-mono text-sm flex items-center gap-2">
                    <span className="text-slate-400 text-right" style={{ minWidth: '45%' }}>
                      {conc.leftContext}
                    </span>
                    <span 
                      className="font-bold px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: `${node.color}22`,
                        color: node.color 
                      }}
                    >
                      {conc.keyword}
                    </span>
                    <span className="text-slate-300">
                      {conc.rightContext}
                    </span>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>
            
            {concordances.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma concordância disponível para esta palavra</p>
              </div>
            )}
          </TabsContent>

          {/* Tab Estatísticas */}
          <TabsContent value="stats" className="space-y-4 mt-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm text-slate-400 mb-2">Frequência e Distribuição</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Frequência Bruta:</span>
                    <span className="font-mono font-bold text-cyan-400">{node.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Normalizada:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {wordNode.rawData.normalizedFrequency.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm text-slate-400 mb-2">Prosódia Semântica</h4>
                <div className="flex items-center gap-3">
                  <Sparkles className={cn(
                    "w-6 h-6",
                    node.prosody === 'Positiva' && "text-green-400",
                    node.prosody === 'Negativa' && "text-red-400",
                    node.prosody === 'Neutra' && "text-slate-400"
                  )} />
                  <div>
                    <p className={cn(
                      "font-bold text-lg",
                      node.prosody === 'Positiva' && "text-green-400",
                      node.prosody === 'Negativa' && "text-red-400",
                      node.prosody === 'Neutra' && "text-slate-400"
                    )}>
                      {node.prosody}
                    </p>
                    <p className="text-xs text-slate-400">Avaliação semântica</p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm text-slate-400 mb-3">Distribuição no Corpus</h4>
                <div className="h-32 flex items-end gap-1">
                  {/* Placeholder para gráfico de distribuição */}
                  <div className="flex-1 bg-cyan-500/20 rounded-t" style={{ height: '60%' }}></div>
                  <div className="flex-1 bg-cyan-500/30 rounded-t" style={{ height: '80%' }}></div>
                  <div className="flex-1 bg-cyan-500/40 rounded-t" style={{ height: '100%' }}></div>
                  <div className="flex-1 bg-cyan-500/30 rounded-t" style={{ height: '70%' }}></div>
                  <div className="flex-1 bg-cyan-500/20 rounded-t" style={{ height: '50%' }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Frequência por artista/música</p>
              </div>
            </div>
          </TabsContent>

          {/* Tab Relacionadas */}
          <TabsContent value="related" className="space-y-3 mt-4 overflow-y-auto">
            <p className="text-sm text-slate-400 mb-4">
              Palavras do mesmo domínio semântico com prosódia similar
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Placeholder para palavras relacionadas */}
              {['campo', 'gaúcho', 'pampa', 'fronteira', 'tradição'].map((word, idx) => (
                <motion.div
                  key={word}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-slate-800/30 rounded-lg p-3 hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <p className="font-semibold" style={{ color: node.color }}>{word}</p>
                  <p className="text-xs text-slate-400 mt-1">Frequência: {Math.floor(Math.random() * 50) + 10}</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
