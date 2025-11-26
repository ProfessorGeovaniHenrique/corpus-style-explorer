import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, Quote } from "lucide-react";
import { StylisticsLevelDetail } from "@/data/developer-logs/stylistics-methodology";

interface StylisticsLevelModalProps {
  level: StylisticsLevelDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StylisticsLevelModal({ level, isOpen, onClose }: StylisticsLevelModalProps) {
  if (!level) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            {level.name}
          </DialogTitle>
          <Badge variant="outline" className="text-xs mt-2 w-fit">
            📖 {level.pageReferences}
          </Badge>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Descrição */}
          <section className="pb-4 border-b border-border/40">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {level.description}
            </p>
          </section>

          {/* Explicação Conceitual */}
          <section>
            <h4 className="font-semibold text-base mb-3 flex items-center gap-2 text-primary">
              <BookOpen className="h-4 w-4" />
              Explicação Conceitual
            </h4>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {level.conceptualExplanation}
            </p>
          </section>
          
          {/* Componentes de Análise */}
          <section>
            <h4 className="font-semibold text-base mb-3 flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Componentes de Análise
            </h4>
            <ul className="space-y-2">
              {level.components.map((comp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{comp}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Exemplos (se existirem) */}
          {level.examples && level.examples.length > 0 && (
            <section>
              <h4 className="font-semibold text-base mb-3 text-primary">
                Exemplos Práticos
              </h4>
              <ul className="space-y-2">
                {level.examples.map((example, i) => (
                  <li key={i} className="text-sm pl-4 border-l-2 border-primary/30 py-1">
                    {example}
                  </li>
                ))}
              </ul>
            </section>
          )}
          
          {/* Citação-chave (se existir) */}
          {level.keyQuote && (
            <section>
              <h4 className="font-semibold text-base mb-3 flex items-center gap-2 text-primary">
                <Quote className="h-4 w-4" />
                Citação Fundamental
              </h4>
              <blockquote className="border-l-4 border-primary/50 pl-4 py-2 italic text-sm text-muted-foreground bg-muted/30 rounded-r">
                "{level.keyQuote}"
              </blockquote>
            </section>
          )}
          
          {/* Referência Bibliográfica */}
          <section className="pt-4 border-t border-border/40">
            <h4 className="font-semibold text-base mb-2 text-primary">
              Referência Bibliográfica
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              LEECH, Geoffrey; SHORT, Mick. <span className="italic">Style in Fiction: A Linguistic Introduction to English Fictional Prose.</span> 2nd ed. Harlow: Pearson Education Limited, 2007.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
