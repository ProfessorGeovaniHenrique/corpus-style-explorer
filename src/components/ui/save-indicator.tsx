import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function SaveIndicator({ isSaving, lastSaved, error }: SaveIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {isSaving && (
        <motion.div
          key="saving"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Salvando...</span>
        </motion.div>
      )}

      {!isSaving && lastSaved && !error && (
        <motion.div
          key="saved"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
        >
          <Check className="h-4 w-4" />
          <span>
            Salvo {formatDistanceToNow(lastSaved, { addSuffix: true, locale: ptBR })}
          </span>
        </motion.div>
      )}

      {error && (
        <motion.div
          key="error"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          <span>Erro ao salvar</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
