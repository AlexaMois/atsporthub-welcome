import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DocumentSidebar from "@/components/DocumentSidebar";
import { FilterItem } from "@/hooks/useDocuments";

interface DocumentLayoutProps {
  children: ReactNode;
  title: string;
  filterOptions: Record<string, FilterItem[]>;
  activeFilters: Record<string, Set<string>>;
  onFilterSelect: (group: string, itemId: string | null) => void;
}

const DocumentLayout = ({
  children,
  title,
  filterOptions,
  activeFilters,
  onFilterSelect,
}: DocumentLayoutProps) => {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        {/* Header */}
        <header className="h-14 bg-primary flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/20" />
            <span className="text-primary-foreground font-semibold text-lg hidden sm:inline">{title}</span>
          </div>
          <span className="text-primary-foreground font-semibold">АТС Портал</span>
          <div className="w-20" />
        </header>

        {/* Body */}
        <div className="flex flex-1 w-full">
          <DocumentSidebar
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            onFilterSelect={onFilterSelect}
          />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DocumentLayout;
