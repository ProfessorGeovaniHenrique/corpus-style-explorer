import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PanelSection } from "./PanelSection";
import type { VisualizationFilters } from "@/data/types/fogPlanetVisualization.types";

interface VisualizationControlsSectionProps {
  filters: VisualizationFilters;
  onFilterChange: (filters: Partial<VisualizationFilters>) => void;
  isOpen?: boolean;
}

export function VisualizationControlsSection({ 
  filters, 
  onFilterChange,
  isOpen = true 
}: VisualizationControlsSectionProps) {
  return (
    <PanelSection 
      title="CONTROLES DE VISUALIZAÇÃO" 
      icon="🎛️" 
      isOpen={isOpen}
    >
      <div className="space-y-4">
        {/* Frequência Mínima */}
        <div className="space-y-2">
          <Label className="text-xs text-foreground/80">
            Frequência Mínima: {filters.minFrequency}
          </Label>
          <Slider
            value={[filters.minFrequency]}
            onValueChange={([v]) => onFilterChange({ minFrequency: v })}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
        </div>

        {/* Máximo de Palavras */}
        <div className="space-y-2">
          <Label className="text-xs text-foreground/80">
            Max Palavras: {filters.maxWords}
          </Label>
          <Slider
            value={[filters.maxWords]}
            onValueChange={([v]) => onFilterChange({ maxWords: v })}
            min={5}
            max={50}
            step={5}
            className="w-full"
          />
        </div>

        {/* Opacidade FOG */}
        <div className="space-y-2">
          <Label className="text-xs text-foreground/80">
            Opacidade FOG: {(filters.fogIntensity * 100).toFixed(1)}%
          </Label>
          <Slider
            value={[filters.fogIntensity]}
            onValueChange={([v]) => onFilterChange({ fogIntensity: v })}
            min={0.002}
            max={1.0}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Intensidade Glow */}
        <div className="space-y-2">
          <Label className="text-xs text-foreground/80">
            Intensidade Glow: {(filters.glowIntensity * 100).toFixed(0)}%
          </Label>
          <Slider
            value={[filters.glowIntensity]}
            onValueChange={([v]) => onFilterChange({ glowIntensity: v })}
            min={0.5}
            max={1.5}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Filtro de Prosódia */}
        <div className="space-y-2">
          <Label className="text-xs text-foreground/80">
            Filtro Prosódia
          </Label>
          <Select
            value={filters.prosodyFilter?.[0] || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                onFilterChange({ prosodyFilter: [] });
              } else {
                onFilterChange({ prosodyFilter: [value as any] });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="positiva">Positiva</SelectItem>
              <SelectItem value="negativa">Negativa</SelectItem>
              <SelectItem value="neutra">Neutra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mostrar Labels */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-foreground/80">Mostrar Labels</Label>
          <Switch
            checked={filters.showLabels}
            onCheckedChange={(checked) => onFilterChange({ showLabels: checked })}
          />
        </div>
      </div>
    </PanelSection>
  );
}
