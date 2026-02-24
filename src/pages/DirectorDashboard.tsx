import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

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

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterItem[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
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

  // filterOptions now loaded from API in useEffect

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

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 bg-primary flex justify-between items-center px-4">
        <Button variant="ghost" className="text-primary-foreground hover:bg-white/20" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Выйти
        </Button>
        <span className="text-primary-foreground font-semibold">АТС Портал</span>
        <span className="text-primary-foreground text-sm opacity-80">Генеральный директор</span>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mx-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          stats.map((s) => (
            <div key={s.label} className="bg-card rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))
        )}
      </div>

      {/* Search */}
      <div className="mx-4 mt-6">
        <Input
          placeholder="Поиск по названию..."
          className="w-full rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Accordion Filters */}
      <div className="mx-4 mt-4">
        <Accordion type="multiple" className="space-y-2">
          {FILTER_GROUPS.map((g) => {
            const items = filterOptions[g.key] || [];
            const selectedCount = activeFilters[g.key]?.size || 0;
            if (items.length === 0) return null;
            return (
              <AccordionItem key={g.key} value={g.key} className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-3 hover:no-underline">
                  {g.title}
                  {selectedCount > 0 && (
                    <span className="ml-2 text-xs text-primary">({selectedCount} выбрано)</span>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 pb-2">
                    {items.map((item) => {
                      const active = activeFilters[g.key]?.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleFilter(g.key, item.id)}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground border"
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* "View as employee" button */}
      <div className="mx-4 mt-4">
        <Button variant="outline" className="border-primary text-primary w-full">
          Посмотреть глазами сотрудника
        </Button>
      </div>

      {/* Document list */}
      <div className="mx-4 mt-6 space-y-3 pb-8">
        {!loading && filteredDocs.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Документы не найдены</p>
        )}
        {filteredDocs.map((doc) => {
          const sid = getStatusId(doc);
          const st = STATUS_MAP[sid];
          const url = extractFileUrl(doc);
          return (
            <div key={doc.id} className="bg-card rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm line-clamp-2 flex-1">{doc.title}</p>
                {st && (
                  <Badge className={`shrink-0 ${st.className} border-0`}>{st.label}</Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {doc.date && <span>{formatDate(doc.date)}</span>}
                {extractLinkedNames(doc.roles) && (
                  <span className="truncate">{extractLinkedNames(doc.roles)}</span>
                )}
              </div>
              {url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary h-7 px-2 text-xs"
                  onClick={() => window.open(url, "_blank")}
                >
                  <Download className="w-3 h-3 mr-1" /> Скачать
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DirectorDashboard;
