import { FileText, FolderOpen, Folder, Compass, Users, BookOpen, Sparkles, Truck, Wrench, Radio, Shield, Stethoscope, HardHat, Zap, Warehouse, UserCog, ClipboardList, Factory, Landmark, Globe, Lightbulb, Atom, Cog, Layers, Target, Briefcase, Hash, Droplets, Flame, X, Send, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBasePath } from "@/hooks/useBasePath";
import { usePortal, FILTER_GROUPS } from "@/lib/portal-context";
import { askRag } from "@/lib/api";
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
import { useState, useRef, useEffect, KeyboardEvent } from "react";
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

export function PortalSidebar({ roleName }: { roleName?: string }) {
  const { filterOptions, activeFilters, setExclusiveFilter, clearFilters, chipCounts } = usePortal();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const q = question.trim();
    if (!q || isLoading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setIsLoading(true);
    try {
      const { answer } = await askRag(q);
      setMessages((prev) => [...prev, { role: "assistant", text: answer || "Пустой ответ" }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", text: err?.message || "Не удалось получить ответ" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const basePath = useBasePath();
  const isDocListPage = location.pathname === basePath;
  const noFiltersActive = Object.values(activeFilters).every(s => s.size === 0);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    projects: true,
    roles: false,
    directions: false,
    source: false,
  });

  const handleAllDocs = () => {
    clearFilters();
    if (!isDocListPage) navigate(basePath);
    if (isMobile) setOpenMobile(false);
  };

  const handleItemClick = (group: string, itemId: string) => {
    setExclusiveFilter(group, itemId);
    if (!isDocListPage) navigate(basePath);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar className="border-r border-gray-100 bg-white">
      <SidebarHeader className="px-4 py-5">
        <span className="text-base font-semibold text-foreground">Портал знаний</span>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {/* All documents */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                onClick={handleAllDocs}
                isActive={isDocListPage && noFiltersActive}
                className="gap-2 data-[active=true]:border-l-[3px] data-[active=true]:border-l-primary data-[active=true]:text-primary data-[active=true]:rounded-l-none data-[active=true]:pl-[calc(0.5rem-3px)]"
              >
                <FileText className="h-4 w-4" />
                <span>Все документы</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Filter groups */}
        {FILTER_GROUPS.map((g) => {
          if ((roleName || basePath === "/portal") && g.key === "roles") return null;
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
                              className="justify-between data-[active=true]:border-l-[3px] data-[active=true]:border-l-primary data-[active=true]:text-primary data-[active=true]:rounded-l-none data-[active=true]:pl-[calc(0.5rem-3px)]"
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
        <div className="px-3 py-4 mt-auto border-t border-gray-100 flex flex-col gap-3 shrink-0">
          {isOpen && (
            <div className={`flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden ${isMobile ? "h-[320px] max-h-[40vh]" : "h-[420px] max-h-[60vh]"}`}>
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-primary/5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  ИИ-ассистент
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500"
                  aria-label="Закрыть"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {messages.length === 0 && !isLoading && (
                  <p className="text-xs text-gray-500 text-center py-6 leading-relaxed">
                    Задайте вопрос по документам АТС
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap break-words ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-100 text-foreground"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-600 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Думаю...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-100 p-2 flex gap-2 items-end">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ваш вопрос..."
                  rows={2}
                  className="flex-1 resize-none rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isLoading || !question.trim()}
                  className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Отправить"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center pb-1.5">Ctrl+Enter — отправить</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-sm font-medium text-primary"
          >
            <Sparkles className="h-4 w-4" />
            Спросить ИИ
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

