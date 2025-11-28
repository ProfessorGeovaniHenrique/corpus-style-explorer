import { useState, useEffect } from "react";
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

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const checkAccess = async () => {
      console.log('[ResetPassword] URL completa:', window.location.href);
      console.log('[ResetPassword] Hash:', window.location.hash);

      // Verificação 1: Hash da URL (fluxo padrão)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (accessToken && type === "recovery") {
        console.log('[ResetPassword] ✅ Acesso via hash válido');
        setIsValidToken(true);
        return;
      }

      // Verificação 2: Sessão existente (fallback)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('[ResetPassword] ✅ Acesso via sessão existente');
        setIsValidToken(true);
        return;
      }

      // Nenhuma das verificações passou
      console.log('[ResetPassword] ❌ Sem hash válido e sem sessão');
      toast.error("Link de recuperação inválido ou expirado");
      setTimeout(() => navigate("/auth"), 3000);
    };

    checkAccess();
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
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Verificando link de recuperação...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                placeholder="••••••••"
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
                placeholder="••••••••"
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
              {isLoading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
