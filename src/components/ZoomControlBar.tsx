import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ZoomControlBarProps {
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onResetZoom: () => void;
  className?: string;
}

export function ZoomControlBar({
  zoomLevel,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetZoom,
  className = ""
}: ZoomControlBarProps) {
  const handleSliderChange = (values: number[]) => {
    onZoomChange(values[0]);
  };

  return (
    <div className={`flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-2 shadow-md ${className}`}>
      {/* Zoom Out */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onZoomOut}
        className="h-9 w-9 hover:bg-muted transition-colors"
        aria-label="Diminuir zoom"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      {/* Zoom In */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onZoomIn}
        className="h-9 w-9 hover:bg-muted transition-colors"
        aria-label="Aumentar zoom"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Zoom Slider */}
      <div className="flex items-center gap-2 min-w-[150px]">
        <span className="text-xs text-muted-foreground whitespace-nowrap">50%</span>
        <Slider
          value={[zoomLevel]}
          onValueChange={handleSliderChange}
          min={0.5}
          max={2}
          step={0.1}
          className="flex-1"
          aria-label="Controle de zoom"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">200%</span>
      </div>

      {/* Zoom Display */}
      <div className="min-w-[45px] text-right">
        <span className="text-xs font-semibold text-foreground">
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Fit to Screen */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onFitToScreen}
        className="h-9 px-3 hover:bg-muted transition-colors"
        aria-label="Ajustar à tela"
      >
        <Maximize2 className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Ajustar</span>
      </Button>

      {/* Reset Zoom */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onResetZoom}
        className="h-9 px-3 hover:bg-muted transition-colors"
        aria-label="Resetar zoom"
      >
        <RotateCcw className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Reset</span>
      </Button>
    </div>
  );
}
