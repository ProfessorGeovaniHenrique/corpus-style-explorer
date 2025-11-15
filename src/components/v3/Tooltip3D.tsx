import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useInteractivityStore, selectTooltip } from '@/store/interactivityStore';
import { useMemo } from 'react';

export function Tooltip3D() {
  const tooltip = useInteractivityStore(selectTooltip);
  
  // Posicionamento inteligente (evitar bordas da tela)
  const smartPosition = useMemo(() => {
    if (!tooltip.isVisible) return tooltip.position;
    
    const offset = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 250;
    
    let { x, y } = tooltip.position;
    
    // Evitar borda direita
    if (x + offset + tooltipWidth > window.innerWidth) {
      x = x - tooltipWidth - offset;
    } else {
      x = x + offset;
    }
    
    // Evitar borda inferior
    if (y + tooltipHeight > window.innerHeight) {
      y = window.innerHeight - tooltipHeight - 20;
    }
    
    // Evitar borda superior
    if (y < 20) {
      y = 20;
    }
    
    return { x, y };
  }, [tooltip]);
  
  if (!tooltip.data) return null;
  
  return (
    <AnimatePresence>
      {tooltip.isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bg-slate-900/98 border-2 rounded-xl p-4 backdrop-blur-xl shadow-2xl z-50 pointer-events-none"
          style={{ 
            left: smartPosition.x, 
            top: smartPosition.y,
            borderColor: tooltip.data.domain.color,
            maxWidth: '320px'
          }}
        >
          {/* Header */}
          <motion.h3 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-bold mb-2 truncate" 
            style={{ color: tooltip.data.domain.color }}
          >
            {tooltip.data.title}
          </motion.h3>
          
          {/* Badge de domínio */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Badge 
              className="mb-3"
              style={{ 
                backgroundColor: `${tooltip.data.domain.color}33`,
                color: tooltip.data.domain.color,
                borderColor: tooltip.data.domain.color
              }}
            >
              {tooltip.data.domain.name}
            </Badge>
          </motion.div>
          
          {/* Grid de estatísticas */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3 text-sm"
          >
            <div className="bg-slate-800/50 rounded p-2">
              <p className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Frequência Bruta
              </p>
              <p className="font-mono font-bold text-cyan-400">{tooltip.data.frequency.raw}</p>
            </div>
            <div className="bg-slate-800/50 rounded p-2">
              <p className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Normalizada
              </p>
              <p className="font-mono font-bold text-cyan-400">
                {tooltip.data.frequency.normalized.toFixed(2)}%
              </p>
            </div>
            
            {/* Prosódia com ícone */}
            <div className="col-span-2 flex items-center gap-2 p-2 bg-slate-800/50 rounded">
              <Sparkles className={cn(
                "w-4 h-4 flex-shrink-0",
                tooltip.data.prosody.type === 'Positiva' && "text-green-400",
                tooltip.data.prosody.type === 'Negativa' && "text-red-400",
                tooltip.data.prosody.type === 'Neutra' && "text-slate-400"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">Prosódia Semântica</p>
                <p className={cn(
                  "font-semibold text-sm",
                  tooltip.data.prosody.type === 'Positiva' && "text-green-400",
                  tooltip.data.prosody.type === 'Negativa' && "text-red-400",
                  tooltip.data.prosody.type === 'Neutra' && "text-slate-400"
                )}>
                  {tooltip.data.prosody.type}
                </p>
              </div>
            </div>
            
            {/* Se for domínio, mostrar stats avançadas */}
            {tooltip.data.type === 'domain' && tooltip.data.lexicalRichness !== undefined && (
              <>
                <div className="bg-slate-800/50 rounded p-2">
                  <p className="text-slate-400 text-xs mb-1">Riqueza Lexical</p>
                  <p className="font-mono font-bold text-purple-400">
                    {(tooltip.data.lexicalRichness * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded p-2">
                  <p className="text-slate-400 text-xs mb-1">Peso Textual</p>
                  <p className="font-mono font-bold text-pink-400">
                    {tooltip.data.textualWeight?.toFixed(1)}%
                  </p>
                </div>
              </>
            )}
          </motion.div>
          
          {/* Hint de ação */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-slate-500 mt-3 border-t border-slate-700 pt-2"
          >
            {tooltip.data.type === 'domain'
              ? "Clique para explorar • Duplo clique para modo orbital"
              : "Clique para ver concordâncias (KWIC)"}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
