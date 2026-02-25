import { FileText, FolderOpen, Compass, Users, BookOpen } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePortal, FILTER_GROUPS } from "@/lib/portal-context";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

const GROUP_ICONS: Record<string, React.ElementType> = {
  projects: FolderOpen,
  roles: Users,
  directions: Compass,
  source: BookOpen,
};

export function PortalSidebar() {
  const { filterOptions, activeFilters, setExclusiveFilter, clearFilters, chipCounts } = usePortal();
  const navigate = useNavigate();
  const location = useLocation();
  const isDocListPage = location.pathname === "/dashboard/director";
  const noFiltersActive = Object.values(activeFilters).every(s => s.size === 0);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    projects: true,
    roles: true,
    directions: true,
    source: true,
  });

  const handleAllDocs = () => {
    clearFilters();
    if (!isDocListPage) navigate("/dashboard/director");
  };

  const handleItemClick = (group: string, itemId: string) => {
    setExclusiveFilter(group, itemId);
    if (!isDocListPage) navigate("/dashboard/director");
  };

  return (
    <Sidebar className="border-r border-gray-100 bg-white">
      <SidebarHeader className="px-4 py-5">
        <span className="text-base font-semibold text-[#0a1628]">Портал знаний</span>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {/* All documents */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleAllDocs}
                isActive={isDocListPage && noFiltersActive}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>Все документы</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Filter groups */}
        {FILTER_GROUPS.map((g) => {
          const items = filterOptions[g.key] || [];
          if (items.length === 0) return null;
          const Icon = GROUP_ICONS[g.key] || FileText;
          const isOpen = openGroups[g.key] ?? true;

          return (
            <Collapsible
              key={g.key}
              open={isOpen}
              onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, [g.key]: open }))}
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer select-none flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      {g.title}
                    </span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => {
                        const active = activeFilters[g.key]?.has(item.id);
                        const count = chipCounts[`${g.key}:${item.id}`] || 0;
                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              onClick={() => handleItemClick(g.key, item.id)}
                              isActive={active}
                              size="sm"
                              className="justify-between"
                            >
                              <span className="truncate">{item.name}</span>
                              <span className="text-[10px] text-gray-400 tabular-nums">{count}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
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
}
