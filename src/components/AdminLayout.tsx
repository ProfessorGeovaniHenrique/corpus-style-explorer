import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { adminToolbarItems } from "@/config/navigationConfig";

export default function AdminLayout() {
  return (
    <>
      <Header />
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
          
          <div className="flex-1 flex flex-col">
            <div className="border-b bg-muted/30 sticky top-[88px] z-40">
              <div className="container mx-auto px-6 py-2 flex items-center gap-2">
                <SidebarTrigger className="-ml-2 mr-2" title="Alternar Sidebar (Ctrl+B / Cmd+B)" />
                <div className="flex items-center gap-1 flex-wrap">
                  {adminToolbarItems.map((item, index) => (
                    <div key={item.url} className="flex items-center">
                      {index === 4 && <div className="w-px h-6 bg-border mx-1" />}
                      <Button variant="ghost" size="sm" asChild>
                        <NavLink to={item.url} activeClassName="bg-primary/10 text-primary">
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.title}
                        </NavLink>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <main className="flex-1 container mx-auto px-6 pt-[132px] pb-8">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
