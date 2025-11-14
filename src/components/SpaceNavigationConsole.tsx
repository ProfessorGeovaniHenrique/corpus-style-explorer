import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Orbit, Star, CircleDot } from "lucide-react";

interface SpaceNavigationConsoleProps {
  level: 'universe' | 'galaxy';
  onNavigate: (level: 'universe' | 'galaxy') => void;
  onFilterChange: (filters: any) => void;
  onReset: () => void;
}

export const SpaceNavigationConsole = ({
  level,
  onNavigate,
  onFilterChange,
  onReset
}: SpaceNavigationConsoleProps) => {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-50 flex gap-6 items-center px-6 py-4 rounded-2xl border-2 backdrop-blur-xl"
         style={{
           top: '10px',
           background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(27, 94, 32, 0.85))',
           borderColor: '#00E5FF',
           boxShadow: '0 0 30px rgba(0, 229, 255, 0.3), inset 0 0 20px rgba(0, 229, 255, 0.1)'
         }}>
      
      {/* Navegação de Níveis */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-cyan-300 uppercase tracking-wider font-bold">Sistema de Navegação</span>
        <div className="flex gap-2">
          <Button
            variant={level === 'universe' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onNavigate('universe')}
            className="space-nav-btn"
            style={{
              background: level === 'universe' ? 'linear-gradient(45deg, #00E5FF, #1B5E20)' : 'transparent',
              borderColor: '#00E5FF',
              color: '#FFFFFF'
            }}
          >
            <Orbit className="w-4 h-4 mr-1" />
            UNIVERSO
          </Button>
          <Button
            variant={level === 'galaxy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onNavigate('galaxy')}
            className="space-nav-btn"
            style={{
              background: level === 'galaxy' ? 'linear-gradient(45deg, #00E5FF, #1B5E20)' : 'transparent',
              borderColor: '#00E5FF',
              color: '#FFFFFF'
            }}
          >
            <Star className="w-4 h-4 mr-1" />
            GALÁXIA
          </Button>
        </div>
      </div>
    </div>
  );
};
