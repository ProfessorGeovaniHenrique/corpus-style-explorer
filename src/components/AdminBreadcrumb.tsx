import { ChevronRight, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AdminBreadcrumbProps {
  currentPage: string;
}

export function AdminBreadcrumb({ currentPage }: AdminBreadcrumbProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-2 text-sm mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/dashboard-mvp-definitivo")}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4" />
        <span>Dashboard</span>
      </Button>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium text-foreground">{currentPage}</span>
    </div>
  );
}
