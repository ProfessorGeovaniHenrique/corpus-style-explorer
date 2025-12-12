import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, ShieldOff, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EMERGENCY_TOKEN = "verso-austral-emergency-2024";
const COOLDOWN_KEY = "emergency_kill_cooldown_until";

export function EmergencyKillButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Carregar cooldown do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(COOLDOWN_KEY);
    if (stored) {
      const until = parseInt(stored, 10);
      if (until > Date.now()) {
        setCooldownUntil(until);
      } else {
        localStorage.removeItem(COOLDOWN_KEY);
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!cooldownUntil) return;

    const interval = setInterval(() => {
      const remaining = cooldownUntil - Date.now();
      if (remaining <= 0) {
        setCooldownUntil(null);
        localStorage.removeItem(COOLDOWN_KEY);
        setTimeRemaining('');
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const handleEmergencyKill = async () => {
    setIsLoading(true);
    const toastId = toast.loading('🚨 Ativando Kill Switch de emergência...');

    try {
      const { data, error } = await supabase.functions.invoke('emergency-kill-jobs', {
        headers: {
          'X-Emergency-Token': EMERGENCY_TOKEN
        }
      });

      if (error) throw error;

      if (data?.success) {
        // Definir cooldown
        const cooldownMs = (data.cooldownMinutes || 30) * 60 * 1000;
        const until = Date.now() + cooldownMs;
        setCooldownUntil(until);
        localStorage.setItem(COOLDOWN_KEY, until.toString());

        toast.success(data.message || 'Kill Switch ativado!', { id: toastId });
      } else {
        toast.error(data?.message || 'Falha ao ativar Kill Switch', { id: toastId });
      }
    } catch (err) {
      console.error('Emergency kill error:', err);
      toast.error(`Erro: ${err instanceof Error ? err.message : 'Falha na comunicação'}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCooldown = () => {
    setCooldownUntil(null);
    localStorage.removeItem(COOLDOWN_KEY);
    toast.info('Cooldown limpo. Kill Switch disponível novamente.');
  };

  // Se em cooldown, mostrar countdown
  if (cooldownUntil && cooldownUntil > Date.now()) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="gap-1 animate-pulse">
          <ShieldOff className="h-3 w-3" />
          Kill Switch Ativo
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {timeRemaining}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCooldown}
          className="text-xs text-muted-foreground"
        >
          Limpar
        </Button>
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          EMERGÊNCIA
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Kill Switch de Emergência
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Esta ação irá <strong>cancelar TODOS os jobs em processamento</strong> e ativar um período de cooldown de 30 minutos.
            </p>
            <div className="bg-destructive/10 p-3 rounded-md text-sm">
              <p className="font-medium text-destructive">⚠️ Use apenas em caso de:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Sistema sobrecarregado/travado</li>
                <li>Banco de dados inacessível</li>
                <li>Jobs em loop infinito</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              O sistema usará Redis para sinalizar parada mesmo se o banco estiver indisponível.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEmergencyKill}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirmar Kill Switch
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
