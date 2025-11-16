import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export type ViewMode = {
  mode: 'geral' | 'subnivel' | 'hierarquico';
  nivel: 1 | 2 | 3 | 4;
};

interface HierarchyViewSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function HierarchyViewSelector({ value, onChange }: HierarchyViewSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualização Hierárquica</CardTitle>
        <CardDescription>
          Escolha como exibir os Domínios Semânticos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modo de Visualização */}
        <div>
          <Label>Modo de Visualização</Label>
          <RadioGroup 
            value={value.mode}
            onValueChange={(v) => onChange({...value, mode: v as any})}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="geral" id="geral" />
              <Label htmlFor="geral" className="cursor-pointer">
                <strong>Geral (DS 1)</strong>
                <p className="text-xs text-muted-foreground">
                  Apenas categorias principais (ex: TRABALHO, NATUREZA)
                </p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="subnivel" id="subnivel" />
              <Label htmlFor="subnivel" className="cursor-pointer">
                <strong>Subníveis</strong>
                <p className="text-xs text-muted-foreground">
                  Escolha o nível de detalhamento (1-4)
                </p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hierarquico" id="hierarquico" />
              <Label htmlFor="hierarquico" className="cursor-pointer">
                <strong>Hierárquico</strong>
                <p className="text-xs text-muted-foreground">
                  Visualização em árvore com todos os níveis
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Slider de Nível (se modo === 'subnivel') */}
        {value.mode === 'subnivel' && (
          <div>
            <Label>Nível de Detalhamento</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[value.nivel]}
                onValueChange={([v]) => onChange({...value, nivel: v as any})}
                min={1}
                max={4}
                step={1}
                className="flex-1"
              />
              <Badge variant="outline">Nível {value.nivel}</Badge>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Geral</span>
              <span>Categoria</span>
              <span>Específico</span>
              <span>Detalhado</span>
            </div>
          </div>
        )}
        
        {/* Preview da Visualização */}
        <div className="border rounded-lg p-3 bg-muted/50">
          <p className="text-xs font-semibold mb-2">Preview:</p>
          <HierarchyPreview mode={value} />
        </div>
      </CardContent>
    </Card>
  );
}

function HierarchyPreview({ mode }: { mode: ViewMode }) {
  if (mode.mode === 'geral') {
    return (
      <div className="flex flex-wrap gap-2">
        <Badge>TRABALHO</Badge>
        <Badge>NATUREZA</Badge>
        <Badge>CULTURA_GAUCHA</Badge>
      </div>
    );
  }
  
  if (mode.mode === 'subnivel') {
    const examples = {
      1: ['TRABALHO', 'NATUREZA', 'CULTURA_GAUCHA'],
      2: ['TRABALHO.LIDA', 'NATUREZA.PAISAGEM', 'CULTURA_GAUCHA.TRADICAO'],
      3: ['TRABALHO.LIDA.CAMPEIRA', 'NATUREZA.PAISAGEM.RELEVO', 'CULTURA_GAUCHA.TRADICAO.VESTIMENTA'],
      4: ['TRABALHO.LIDA.CAMPEIRA.DOMA', 'NATUREZA.PAISAGEM.RELEVO.COXILHA']
    };
    return (
      <div className="flex flex-wrap gap-2">
        {examples[mode.nivel].map(ex => (
          <Badge key={ex} variant="outline">{ex}</Badge>
        ))}
      </div>
    );
  }
  
  if (mode.mode === 'hierarquico') {
    return (
      <div className="space-y-2 text-sm font-mono">
        <div>
          <Badge>TRABALHO</Badge>
          <div className="ml-4 mt-1 space-y-1">
            <div>
              <Badge variant="secondary">TRABALHO.LIDA</Badge>
              <div className="ml-4 mt-1">
                <Badge variant="outline" className="text-xs">TRABALHO.LIDA.CAMPEIRA</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
