import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, Percent } from "lucide-react";

interface DomainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainData: {
    nome: string;
    cor: string;
    ocorrencias: number;
    percentual: number;
    riquezaLexical: number;
    avgLL?: number;
    palavras: string[];
  } | null;
  onWordClick: (word: string) => void;
}

export function DomainModal({ open, onOpenChange, domainData, onWordClick }: DomainModalProps) {
  if (!domainData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-5 h-5 rounded-full shadow-md" 
              style={{ backgroundColor: domainData.cor }} 
            />
            <span className="text-2xl">{domainData.nome}</span>
          </DialogTitle>
          <DialogDescription>
            Análise completa do domínio semântico e suas palavras-chave
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas em Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-2" style={{ borderColor: domainData.cor }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Ocorrências</span>
                </div>
                <div className="text-3xl font-bold">{domainData.ocorrencias.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="border-2" style={{ borderColor: domainData.cor }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">do Corpus</span>
                </div>
                <div className="text-3xl font-bold">{domainData.percentual.toFixed(2)}%</div>
              </CardContent>
            </Card>

            <Card className="border-2" style={{ borderColor: domainData.cor }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Riqueza Lexical</span>
                </div>
                <div className="text-3xl font-bold">{domainData.riquezaLexical}</div>
                <p className="text-xs text-muted-foreground mt-1">palavras únicas</p>
              </CardContent>
            </Card>
          </div>

          {/* Barra de distribuição no corpus */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Distribuição no Corpus</span>
              <span className="text-sm text-muted-foreground">{domainData.percentual.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-background rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 rounded-full transition-all duration-500 shadow-sm" 
                style={{ 
                  width: `${domainData.percentual}%`,
                  backgroundColor: domainData.cor 
                }} 
              />
            </div>
          </div>

          {/* Palavras-chave do domínio */}
          <div>
            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span>Palavras-chave do domínio</span>
              <Badge variant="secondary">{domainData.palavras.length}</Badge>
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Clique em qualquer palavra para ver suas concordâncias (KWIC)
            </p>
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 bg-muted/20 rounded-lg">
              {domainData.palavras.sort().map((palavra, idx) => (
                <Badge
                  key={idx}
                  className="cursor-pointer hover:scale-110 hover:shadow-lg transition-all text-sm px-3 py-1.5 border-0"
                  style={{
                    backgroundColor: domainData.cor,
                    color: '#fff'
                  }}
                  onClick={() => {
                    onOpenChange(false);
                    onWordClick(palavra);
                  }}
                >
                  {palavra}
                </Badge>
              ))}
            </div>
          </div>

          {/* Informação adicional */}
          {domainData.avgLL && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Significância Estatística Média
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Log-Likelihood médio: <strong>{domainData.avgLL.toFixed(2)}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
