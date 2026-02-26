import { FileText, FolderOpen, Folder, Compass, Users, BookOpen, Sparkles, Truck, Wrench, Radio, Shield, Stethoscope, HardHat, Zap, Warehouse, UserCog, ClipboardList, Factory, Landmark, Globe, Lightbulb, Atom, Cog, Layers, Target, Briefcase, Hash, Droplets, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const ITEM_ICON_MAP: [string, LucideIcon][] = [
  ["водитель", Truck],
  ["механик", Wrench],
  ["диспетчер", Radio],
  ["бдд", Shield],
  ["медработник", Stethoscope],
  ["машинист", HardHat],
  ["электромонтёр", Zap],
  ["электромонтер", Zap],
  ["кладовщик", Warehouse],
  ["кадр", UserCog],
  ["начальник", ClipboardList],
  ["лтк", Factory],
  ["стропальщик", Landmark],
  ["вчнг", Droplets],
  ["гпнз", Flame],
  ["все сотр", Users],
  ["рабочий", HardHat],
];

const FALLBACK_ICONS: LucideIcon[] = [Globe, Lightbulb, Atom, Cog, Layers, Target, Briefcase, Hash];

function getItemIcon(name: string, index: number): LucideIcon {
  const lower = name.toLowerCase();
  for (const [substr, icon] of ITEM_ICON_MAP) {
    if (lower.includes(substr)) return icon;
  }
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

const GROUP_ICONS: Record<string, React.ElementType> = {
  projects: FolderOpen,
  roles: Users,
  directions: Compass,
  source: BookOpen,
};

export function PortalSidebar() {
  const { filterOptions, activeFilters, setExclusiveFilter, clearFilters, chipCounts } = usePortal();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const isDocListPage = location.pathname === "/dashboard/director";
  const noFiltersActive = Object.values(activeFilters).every(s => s.size === 0);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    projects: true,
    roles: false,
    directions: false,
    source: false,
  });

  const handleAllDocs = () => {
    clearFilters();
    if (!isDocListPage) navigate("/dashboard/director");
    if (isMobile) setOpenMobile(false);
  };

  const handleItemClick = (group: string, itemId: string) => {
    setExclusiveFilter(group, itemId);
    if (!isDocListPage) navigate("/dashboard/director");
    if (isMobile) setOpenMobile(false);
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
                className="gap-2 data-[active=true]:border-l-[3px] data-[active=true]:border-l-[#0099ff] data-[active=true]:text-[#0099ff] data-[active=true]:rounded-l-none data-[active=true]:pl-[calc(0.5rem-3px)]"
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
                      {items.map((item, idx) => {
                        const active = activeFilters[g.key]?.has(item.id);
                        const count = chipCounts[`${g.key}:${item.id}`] || 0;
                        const ItemIcon = g.key === "projects" ? Folder : getItemIcon(item.name, idx);
                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              onClick={() => handleItemClick(g.key, item.id)}
                              isActive={active}
                              size="sm"
                              className="justify-between data-[active=true]:border-l-[3px] data-[active=true]:border-l-[#0099ff] data-[active=true]:text-[#0099ff] data-[active=true]:rounded-l-none data-[active=true]:pl-[calc(0.5rem-3px)]"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <ItemIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                <span className="truncate">{item.name}</span>
                              </span>
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
        <div className="px-3 py-4 mt-auto border-t border-gray-100">
          <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0099ff]/10 hover:bg-[#0099ff]/20 transition-colors text-sm font-medium text-[#0099ff]">
            <Sparkles className="h-4 w-4" />
            Спросить ИИ
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
