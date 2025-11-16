import logoUfrgs from "@/assets/logo-ufrgs.png";
import logoPpglet from "@/assets/logo-ppglet.png";
import { Badge } from "@/components/ui/badge";
export function MVPHeader() {
  return <header className="header-academic">
      <div className="container-academic">
        <div className="flex items-center justify-between">
          <div className="h-20 w-auto">
            
          </div>
          
          <div className="text-center flex-1 px-6">
            <h1 className="text-3xl font-bold text-primary font-heading">
              VersoAustral - Análise de Estilística de Corpus
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Corpus de Estudo: Clássicos da Música Gaúcha
            </p>
          </div>

          <div className="flex flex-col gap-2">
            
            
          </div>

          <div className="h-20 w-auto ml-4">
            
          </div>
        </div>
      </div>
    </header>;
}