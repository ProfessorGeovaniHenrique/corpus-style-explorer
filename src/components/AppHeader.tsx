import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";

export function AppHeader() {
  return (
    <header className="h-16 border-b border-border flex items-center justify-end px-6 gap-3 bg-card/50 backdrop-blur-sm">
      <Button variant="outline" asChild>
        <NavLink to="/entrar">Entrar</NavLink>
      </Button>
      <Button asChild>
        <NavLink to="/cadastro">Cadastre-se</NavLink>
      </Button>
    </header>
  );
}
