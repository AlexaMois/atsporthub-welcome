import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Download, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface LinkedObj {
  catalogId: string;
  recordId: string;
  recordTitle: string;
}

interface FilterItem {
  id: string;
  name: string;
}

const FUNC_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bpium-api`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const fetchAction = async (action: string) => {
  const res = await fetch(`${FUNC_URL}?action=${action}`, {
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`${action} failed: ${res.status}`);
  return res.json();
};

const getStatusId = (doc: any): number => {
  if (Array.isArray(doc.status)) return parseInt(doc.status[0]) || 0;
  return Number(doc.status) || 0;
};

const STATUS_MAP: Record<number, { label: string; className: string }> = {
  1: { label: "Черновик", className: "bg-gray-200 text-gray-700" },
  2: { label: "На проверке", className: "bg-yellow-100 text-yellow-800" },
  3: { label: "Утверждён", className: "bg-green-100 text-green-800" },
  4: { label: "Отклонён", className: "bg-red-100 text-red-800" },
};

const formatDate = (d: any): string => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

const extractLinkedNames = (field: any): string => {
  if (!Array.isArray(field)) return "";
  return field.map((o: LinkedObj) => o.recordTitle).filter(Boolean).join(", ");
};

const extractFileUrl = (doc: any): string | null => {
  if (doc.fileUrl) {
    if (Array.isArray(doc.fileUrl) && doc.fileUrl[0]?.url) return doc.fileUrl[0].url;
    if (typeof doc.fileUrl === "string") return doc.fileUrl;
  }
  if (Array.isArray(doc.responsible) && doc.responsible[0]?.url) {
    return doc.responsible[0].url;
  }
  return null;
};

const FILTER_GROUPS = [
  { key: "projects", title: "Проекты", action: "get-projects" },
  { key: "roles", title: "Роли", action: "get-roles" },
  { key: "directions", title: "Направления", action: "get-directions" },
  { key: "source", title: "Источники", action: "get-sources" },
] as const;

const FilterPanel = ({
  filterOptions,
  activeFilters,
  toggleFilter,
  chipCounts,
}: {
  filterOptions: Record<string, FilterItem[]>;
  activeFilters: Record<string, Set<string>>;
  toggleFilter: (group: string, itemId: string) => void;
  chipCounts: Record<string, number>;
}) => (
  <div>
    {FILTER_GROUPS.map((g, gi) => {
      const items = filterOptions[g.key] || [];
      if (items.length === 0) return null;
      return (
        <div key={g.key}>
          <h4 className={`text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 ${gi > 0 ? "mt-4" : ""}`}>
            {g.title}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => {
              const active = activeFilters[g.key]?.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleFilter(g.key, item.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    active
                      ? "bg-[#0099ff] text-white border-[#0099ff]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-[#0099ff] hover:text-[#0099ff]"
                  }`}
                >
                  {item.name} ({chipCounts[`${g.key}:${item.id}`] || 0})
                </button>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
);

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterItem[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({
    projects: new Set(),
    roles: new Set(),
    directions: new Set(),
    source: new Set(),
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [docsData, roles, projects, directions, sources] = await Promise.all([
          fetchAction("get-documents"),
          fetchAction("get-roles"),
          fetchAction("get-projects"),
          fetchAction("get-directions"),
          fetchAction("get-sources"),
        ]);
        if (Array.isArray(docsData)) setDocs(docsData);

        const toItems = (data: any[]): FilterItem[] =>
          Array.isArray(data) ? data.map((r: any) => ({ id: String(r.id), name: r.name || `#${r.id}` })) : [];

        setFilterOptions({
          projects: toItems(projects),
          roles: toItems(roles),
          directions: toItems(directions),
          source: toItems(sources),
        });
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    let approved = 0, inReview = 0, newThisMonth = 0;
    docs.forEach((d) => {
      const sid = getStatusId(d);
      if (sid === 3) approved++;
      if (sid === 2) inReview++;
      if (d.date) {
        const dt = new Date(d.date);
        if (dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()) newThisMonth++;
      }
    });
    return [
      { label: "Всего документов", value: docs.length },
      { label: "Утверждено", value: approved },
      { label: "На согласовании", value: inReview },
      { label: "Новых за месяц", value: newThisMonth },
    ];
  }, [docs]);

  const chipCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(doc => {
      ['roles', 'projects', 'directions', 'source'].forEach(field => {
        const arr = doc[field];
        if (Array.isArray(arr)) {
          arr.forEach((o: any) => {
            const key = `${field}:${o.recordId}`;
            counts[key] = (counts[key] || 0) + 1;
          });
        }
      });
    });
    return counts;
  }, [docs]);

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      if (searchQuery && !doc.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      for (const g of FILTER_GROUPS) {
        const sel = activeFilters[g.key];
        if (sel && sel.size > 0) {
          const docField = doc[g.key];
          if (!Array.isArray(docField) || !docField.some((o: LinkedObj) => sel.has(o.recordId))) return false;
        }
      }
      return true;
    });
  }, [docs, activeFilters, searchQuery]);

  const toggleFilter = (group: string, itemId: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      const s = new Set(prev[group]);
      if (s.has(itemId)) s.delete(itemId); else s.add(itemId);
      next[group] = s;
      return next;
    });
  };

  const totalActiveFilters = Object.values(activeFilters).reduce((sum, s) => sum + s.size, 0);

  const extractRoleBadges = (doc: any) => {
    if (!Array.isArray(doc.roles)) return { visible: [], extra: 0 };
    const all = doc.roles.map((o: LinkedObj) => o.recordTitle).filter(Boolean);
    return { visible: all.slice(0, 3), extra: Math.max(0, all.length - 3) };
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <header className="h-14 bg-[#0099ff] flex items-center justify-between px-4">
        <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Выйти
        </Button>
        <span className="text-white font-semibold">АТС Портал</span>
        <div className="flex items-center gap-3">
          <button className="text-sm underline text-white opacity-80 hover:opacity-100 hidden md:inline">
            Посмотреть глазами сотрудника
          </button>
          <span className="text-white text-sm opacity-80">Генеральный директор</span>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#0099ff]" />
          </div>
        ) : (
          stats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-[#0099ff] pl-3">
              <div className="text-2xl font-bold text-[#0a1628]">{s.value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          ))
        )}
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 mt-6 flex gap-6 pb-8">
        {/* Sidebar filters — desktop */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-20 bg-white rounded-lg shadow-sm p-4">
            <FilterPanel
              filterOptions={filterOptions}
              activeFilters={activeFilters}
              toggleFilter={toggleFilter}
              chipCounts={chipCounts}
            />
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile filters toggle */}
          {isMobile && (
            <div className="mb-4">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-1.5 text-sm text-gray-600 bg-white rounded-lg shadow-sm px-3 py-2 w-full justify-between"
              >
                <span>Фильтры{totalActiveFilters > 0 ? ` (${totalActiveFilters} активных)` : ""}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </button>
              {filtersOpen && (
                <div className="mt-2 bg-white rounded-lg shadow-sm p-4">
                  <FilterPanel
                    filterOptions={filterOptions}
                    activeFilters={activeFilters}
                    toggleFilter={toggleFilter}
                    chipCounts={chipCounts}
                  />
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Поиск по названию..."
              className="w-full h-11 pl-9 pr-4 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Document list */}
          <div>
            {!loading && filteredDocs.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Документы не найдены</p>
            )}
            {filteredDocs.map((doc) => {
              const sid = getStatusId(doc);
              const st = STATUS_MAP[sid];
              const url = extractFileUrl(doc);
              const { visible: roleBadges, extra: roleExtra } = extractRoleBadges(doc);
              return (
                <div key={doc.id} className="py-4 border-b border-gray-100 hover:bg-gray-50 group relative">
                  {/* Top line */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[#0a1628] group-hover:text-[#0099ff] line-clamp-2 flex-1 transition-colors">
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {st && (
                        <Badge className={`${st.className} border-0 text-xs`}>{st.label}</Badge>
                      )}
                      {url && (
                        <button
                          onClick={() => window.open(url, "_blank")}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#0099ff] p-1"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Bottom line */}
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    {doc.date && <span>{formatDate(doc.date)}</span>}
                    {roleBadges.map((name: string, i: number) => (
                      <span key={i} className="bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">{name}</span>
                    ))}
                    {roleExtra > 0 && (
                      <span className="bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">+{roleExtra}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DirectorDashboard;
