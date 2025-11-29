import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logoVersoAustral from "@/assets/logo-versoaustral-completo.png";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [checkAttempt, setCheckAttempt] = useState(0);
  const processingRef = useRef(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // BLOQUEIO IMEDIATO SÍNCRONO - previne execução duplicada
    if (processingRef.current) {
      console.log('[ResetPassword] ⛔ Execução duplicada bloqueada');
      return;
    }
    processingRef.current = true;
    
    let isMounted = true;
    
    console.log('[ResetPassword] 🚀 Inicializando...');
    console.log('[ResetPassword] 📍 URL:', window.location.href);
    console.log('[ResetPassword] 🔗 Hash:', window.location.hash || '(vazio)');

    // 1. LISTENER PRIMEIRO - captura eventos do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[ResetPassword] 🔔 Auth Event:', event);
        console.log('[ResetPassword] 🔔 Session:', session ? 'existe' : 'null');
        
        if (!isMounted) return;
        
        // Priorizar INITIAL_SESSION para recovery
        if (event === 'INITIAL_SESSION' && session) {
          console.log('[ResetPassword] ✅ INITIAL_SESSION com sessão - permitindo reset');
          setIsValidToken(true);
          setIsChecking(false);
          return;
        }
        
        // Evento específico de recovery
        if (event === 'PASSWORD_RECOVERY') {
          console.log('[ResetPassword] ✅ PASSWORD_RECOVERY detectado!');
          setIsValidToken(true);
          setIsChecking(false);
          return;
        }
        
        // Fallback: usuário logado
        if (event === 'SIGNED_IN' && session) {
          console.log('[ResetPassword] ✅ Sessão válida detectada via SIGNED_IN');
          setIsValidToken(true);
          setIsChecking(false);
        }
      }
    );

    // 2. VERIFICAÇÃO COM RETRY
    const checkSessionWithRetry = async () => {
      const maxAttempts = 5;
      const delayMs = 800;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (!isMounted) return;
        
        setCheckAttempt(attempt);
        console.log(`[ResetPassword] 🔄 Tentativa ${attempt}/${maxAttempts}...`);
        
        // Verificar hash (pode ter sido preservado)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");
        
        if (accessToken && type === "recovery") {
          console.log('[ResetPassword] ✅ Hash válido encontrado!');
          setIsValidToken(true);
          setIsChecking(false);
          return;
        }
        
        // Verificar sessão existente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[ResetPassword] ❌ Erro getSession:', error);
        }
        
        if (session) {
          console.log('[ResetPassword] ✅ Sessão encontrada:', session.user.email);
          setIsValidToken(true);
          setIsChecking(false);
          return;
        }
        
        // Aguardar antes da próxima tentativa
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      
      // Verificação final antes de mostrar erro
      console.log('[ResetPassword] 🔍 Verificação final de sessão...');
      const { data: { session: finalCheck } } = await supabase.auth.getSession();
      
      if (finalCheck) {
        console.log('[ResetPassword] ✅ Sessão encontrada na verificação final!');
        setIsValidToken(true);
        setIsChecking(false);
        return;
      }
      
      // Todas as tentativas falharam
      if (isMounted) {
        console.log('[ResetPassword] ❌ Todas as tentativas falharam - token realmente inválido');
        setIsChecking(false);
        toast.error("Link de recuperação inválido ou expirado. Solicite um novo link.");
        setTimeout(() => navigate("/forgot-password"), 3000);
      }
    };

    checkSessionWithRetry();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => navigate("/auth"), 1500);
    } catch (error: any) {
      console.error('[ResetPassword] ❌ Erro ao resetar:', error);
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  // Estado de verificação
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Verificando link de recuperação...
              </p>
              <p className="text-xs text-muted-foreground">
                Tentativa {checkAttempt}/5
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token inválido
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <p className="text-center text-destructive font-medium">
                Link inválido ou expirado
              </p>
              <p className="text-center text-muted-foreground text-sm">
                Redirecionando para solicitar novo link...
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/forgot-password")}
                className="mt-4"
              >
                Solicitar Novo Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de reset
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg border-2 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={logoVersoAustral} 
              alt="VersoAustral" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-heading text-primary">
              Nova Senha
            </CardTitle>
            <CardDescription>
              Escolha uma nova senha para sua conta
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                autoFocus
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                autoComplete="new-password"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full btn-versoaustral-secondary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
