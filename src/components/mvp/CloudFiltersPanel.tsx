import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CloudFiltersPanelProps {
  searchTerm: string;
  selectedDomain: string;
  selectedProsody: string;
  selectedSignificance: string;
  onSearchChange: (value: string) => void;
  onDomainChange: (value: string) => void;
  onProsodyChange: (value: string) => void;
  onSignificanceChange: (value: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  availableDomains: string[];
  totalNodes: number;
  filteredNodes: number;
}

export function CloudFiltersPanel(props: CloudFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="p-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-semibold">Filtros</span>
              {props.hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {props.filteredNodes} de {props.totalNodes}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {isOpen ? 'Fechar' : 'Expandir'}
            </span>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-4 space-y-4">
          {/* Busca por termo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Buscar Palavra</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Digite uma palavra..."
                value={props.searchTerm}
                onChange={(e) => props.onSearchChange(e.target.value)}
                className="pl-9"
              />
              {props.searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => props.onSearchChange('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Filtro por Domínio */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Domínio Semântico</Label>
            <Select value={props.selectedDomain} onValueChange={props.onDomainChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os domínios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os domínios</SelectItem>
                {props.availableDomains.map(domain => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtro por Prosódia */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Prosódia Semântica</Label>
            <Select value={props.selectedProsody} onValueChange={props.onProsodyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as prosódias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="positive">😊 Positiva</SelectItem>
                <SelectItem value="neutral">😐 Neutra</SelectItem>
                <SelectItem value="negative">😔 Negativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtro por Significância */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Significância Estatística</Label>
            <Select value={props.selectedSignificance} onValueChange={props.onSignificanceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Botão Limpar Filtros */}
          {props.hasActiveFilters && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={props.onClearAll}
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </Button>
          )}
          
          {/* Resumo dos filtros */}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Exibindo <strong>{props.filteredNodes}</strong> de <strong>{props.totalNodes}</strong> palavras
            </p>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
