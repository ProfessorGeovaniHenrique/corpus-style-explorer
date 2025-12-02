import { useState } from 'react';
import { 
  Menu, Moon, Sun, LogOut, GraduationCap, Microscope, Sparkles, BookText,
  Library, Music, Activity, Tags, Database, BookOpen, FileQuestion,
  Key, Users, BarChart3, History, CircuitBoard, Telescope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, role, signOut, isAdmin } = useAuthContext();
  const { mode, toggleTheme } = useTheme();
  
  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/');
  };
  
  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden h-9 w-9"
          aria-label="Menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          <nav className="flex flex-col gap-2 p-4">
            {/* Informações do usuário */}
            {user && (
              <div className="pb-3 border-b mb-2">
                <p className="text-sm font-medium truncate">{user.email}</p>
                {role && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {role === 'admin' ? 'Administrador' : 'Avaliador'}
                  </p>
                )}
              </div>
            )}
            
            {/* Controle de Tema */}
            <Button 
              variant="outline" 
              onClick={toggleTheme}
              className="justify-start gap-2"
            >
              {mode === 'academic' ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Modo Cósmico</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Modo Acadêmico</span>
                </>
              )}
            </Button>
            
            <Separator className="my-2" />
            
            {/* Páginas Principais */}
            {user && (
              <>
                <div className="text-xs text-muted-foreground font-medium px-3 py-1">
                  Páginas Principais
                </div>
                
                <Button variant="ghost" onClick={() => handleNavigate('/dashboard-mvp-definitivo')} className="justify-start gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Dashboard Educacional</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/dashboard-analise')} className="justify-start gap-2">
                  <Microscope className="h-4 w-4" />
                  <span>Dashboard de Análise</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/dashboard-expandido')} className="justify-start gap-2">
                  <BookText className="h-4 w-4" />
                  <span>Dashboard Expandido</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/advanced-mode')} className="justify-start gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Modo Avançado</span>
                </Button>
              </>
            )}
            
            {/* Ferramentas de Dados - Admin Only */}
            {isAdmin() && (
              <>
                <Separator className="my-2" />
                <div className="text-xs text-muted-foreground font-medium px-3 py-1">
                  Ferramentas de Dados
                </div>
                
                <Button variant="ghost" onClick={() => handleNavigate('/music-catalog')} className="justify-start gap-2">
                  <Library className="h-4 w-4" />
                  <span>Catálogo de Músicas</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/music-enrichment')} className="justify-start gap-2">
                  <Music className="h-4 w-4" />
                  <span>Enriquecimento Musical</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/admin/semantic-pipeline')} className="justify-start gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Pipeline Semântica</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/admin/semantic-tagset-validation')} className="justify-start gap-2">
                  <Tags className="h-4 w-4" />
                  <span>Validação de Domínios</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/admin/lexicon-setup')} className="justify-start gap-2">
                  <Database className="h-4 w-4" />
                  <span>Configuração de Léxico</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/admin/dictionary-import')} className="justify-start gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Importação de Dicionários</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/admin/quiz-curation')} className="justify-start gap-2">
                  <FileQuestion className="h-4 w-4" />
                  <span>Curadoria de Quiz</span>
                </Button>
              </>
            )}
            
            {/* Administração - Admin Only */}
            {isAdmin() && (
              <>
                <Separator className="my-2" />
                <div className="text-xs text-muted-foreground font-medium px-3 py-1">
                  Administração
                </div>
                
                <Button variant="ghost" onClick={() => handleNavigate('/admin/dashboard')} className="justify-start gap-2">
                  <Key className="h-4 w-4" />
                  <span>Gerenciar Convites</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/admin/users')} className="justify-start gap-2">
                  <Users className="h-4 w-4" />
                  <span>Gerenciar Usuários</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/admin/metrics')} className="justify-start gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Métricas do Sistema</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/admin/analytics')} className="justify-start gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </Button>
              </>
            )}
            
            {/* Desenvolvimento - Admin Only */}
            {isAdmin() && (
              <>
                <Separator className="my-2" />
                <div className="text-xs text-muted-foreground font-medium px-3 py-1">
                  Desenvolvimento
                </div>
                
                <Button variant="ghost" onClick={() => handleNavigate('/developer-logs')} className="justify-start gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Developer Logs</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/developer-history')} className="justify-start gap-2">
                  <History className="h-4 w-4" />
                  <span>Developer History</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/devops-metrics')} className="justify-start gap-2">
                  <CircuitBoard className="h-4 w-4" />
                  <span>DevOps Metrics</span>
                </Button>
                
                <Button variant="ghost" onClick={() => handleNavigate('/admin/prototypes')} className="justify-start gap-2">
                  <Telescope className="h-4 w-4" />
                  <span>Galeria de Protótipos</span>
                </Button>
              </>
            )}
            
            {/* Botões de ação */}
            {!user ? (
              <>
                <Separator className="my-2" />
                <Button variant="outline" onClick={() => handleNavigate('/auth')} className="justify-start">
                  Entrar
                </Button>
              </>
            ) : (
              <>
                <Separator className="my-2" />
                <Button variant="destructive" onClick={handleSignOut} className="justify-start gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </Button>
              </>
            )}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
