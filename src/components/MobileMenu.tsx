import { useState } from 'react';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { navigationGroups, NavItem } from '@/config/navigationConfig';

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

  // Render a single nav item
  const renderNavItem = (item: NavItem) => (
    <Button 
      key={item.url}
      variant="ghost" 
      onClick={() => handleNavigate(item.url)} 
      className="justify-start gap-2"
    >
      <item.icon className="h-4 w-4" />
      <span>{item.title}</span>
    </Button>
  );
  
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
            {/* User info */}
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
            
            {/* Theme toggle */}
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
            
            {/* Render navigation groups from config */}
            {user && navigationGroups.map((group, index) => {
              // Skip admin-only groups for non-admins
              if (group.adminOnly && !isAdmin()) return null;
              
              return (
                <div key={group.label}>
                  {index > 0 && <Separator className="my-2" />}
                  <div className="text-xs text-muted-foreground font-medium px-3 py-1">
                    {group.label}
                  </div>
                  {group.items.map(renderNavItem)}
                </div>
              );
            })}
            
            {/* Action buttons */}
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
