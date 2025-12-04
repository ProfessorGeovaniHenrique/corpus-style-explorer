import { 
  LayoutDashboard, Sparkles, BookOpen, CircuitBoard, Activity, 
  GraduationCap, Microscope, BookText, Library, Music, Tags, 
  Database, Key, Users, BarChart3, History, Telescope, FileQuestion
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard Educacional", url: "/dashboard-mvp-definitivo", icon: GraduationCap },
  { title: "Dashboard de Análise", url: "/dashboard-analise", icon: Microscope },
  { title: "Dashboard Expandido", url: "/dashboard-expandido", icon: BookText },
  { title: "Modo Avançado", url: "/advanced-mode", icon: Sparkles },
];

const dataToolsItems = [
  { title: "Catálogo de Músicas", url: "/music-catalog", icon: Library },
  { title: "Enriquecimento Musical", url: "/music-enrichment", icon: Music },
  { title: "Pipeline Semântica", url: "/admin/semantic-pipeline", icon: Activity },
  { title: "Validação de Domínios", url: "/admin/semantic-tagset-validation", icon: Tags },
  { title: "Configuração de Léxico", url: "/admin/lexicon-setup", icon: Database },
  { title: "Importação de Dicionários", url: "/admin/dictionary-import", icon: BookOpen },
  { title: "Curadoria de Quiz", url: "/admin/quiz", icon: FileQuestion },
];

const administrationItems = [
  { title: "Gerenciar Convites", url: "/admin/dashboard", icon: Key },
  { title: "Gerenciar Usuários", url: "/admin/users", icon: Users },
  { title: "Métricas do Sistema", url: "/admin/metrics", icon: BarChart3 },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

const devItems = [
  { title: "Developer Logs", url: "/developer-logs", icon: BookOpen },
  { title: "Developer History", url: "/developer-history", icon: History },
  { title: "DevOps Metrics", url: "/devops-metrics", icon: CircuitBoard },
  { title: "Galeria de Protótipos", url: "/admin/prototypes", icon: Telescope },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { advancedModeEnabled } = useFeatureAccess();
  const { isAdmin } = useAuthContext();

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <div className="flex items-center justify-between px-2 py-2 border-b">
        {open && <span className="text-sm font-semibold text-muted-foreground">Menu</span>}
        <SidebarTrigger className={open ? "" : "mx-auto"} />
      </div>
      
      <SidebarContent className="overflow-y-auto">
        {/* Páginas Principais */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Páginas Principais
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-2 hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ferramentas de Dados - Admin Only */}
        {isAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              Ferramentas de Dados
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dataToolsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className="flex items-center gap-2 hover:bg-muted/50"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Administração - Admin Only */}
        {isAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {administrationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className="flex items-center gap-2 hover:bg-muted/50"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Developer Tools - Admin Only */}
        {isAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              Desenvolvimento
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {devItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className="flex items-center gap-2 hover:bg-muted/50"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
