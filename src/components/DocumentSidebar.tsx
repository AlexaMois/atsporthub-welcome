import { FileText, FolderOpen, Users, Compass, BookOpen, ChevronRight } from "lucide-react";
import { FilterItem } from "@/hooks/useDocuments";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DocumentSidebarProps {
  filterOptions: Record<string, FilterItem[]>;
  activeFilters: Record<string, Set<string>>;
  onFilterSelect: (group: string, itemId: string | null) => void;
}

const SECTIONS = [
  { key: "projects", label: "Проекты", icon: FolderOpen },
  { key: "directions", label: "Направления", icon: Compass },
  { key: "roles", label: "По ролям", icon: Users },
  { key: "source", label: "Источники", icon: BookOpen },
];

const DocumentSidebar = ({ filterOptions, activeFilters, onFilterSelect }: DocumentSidebarProps) => {
  const hasAnyFilter = Object.values(activeFilters).some(s => s.size > 0);

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarContent className="pt-2">
        {/* All documents */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onFilterSelect("__reset", null)}
                isActive={!hasAnyFilter}
                className="font-medium"
              >
                <FileText className="h-4 w-4" />
                <span>Все документы</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Filter sections */}
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const items = filterOptions[key] || [];
          if (items.length === 0) return null;
          const active = activeFilters[key] || new Set<string>();

          return (
            <Collapsible key={key} defaultOpen={active.size > 0}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent rounded-md transition-colors px-2 py-1.5 flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            onClick={() => onFilterSelect(key, item.id)}
                            isActive={active.has(item.id)}
                            className="text-sm pl-6"
                          >
                            <span className="truncate">{item.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
};

export default DocumentSidebar;
