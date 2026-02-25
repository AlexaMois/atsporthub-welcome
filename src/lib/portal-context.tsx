import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";

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

export const getStatusId = (doc: any): number => {
  if (Array.isArray(doc.status)) return parseInt(doc.status[0]) || 0;
  return Number(doc.status) || 0;
};

export const STATUS_MAP: Record<number, { label: string; className: string }> = {
  1: { label: "Черновик", className: "bg-gray-200 text-gray-700" },
  2: { label: "На проверке", className: "bg-yellow-100 text-yellow-800" },
  3: { label: "Утверждён", className: "bg-green-100 text-green-800" },
  4: { label: "Отклонён", className: "bg-red-100 text-red-800" },
};

export const formatDate = (d: any): string => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

export const extractLinkedNames = (field: any): string => {
  if (!Array.isArray(field)) return "";
  return field.map((o: LinkedObj) => o.recordTitle).filter(Boolean).join(", ");
};

export const extractFileUrl = (doc: any): string | null => {
  if (doc.fileUrl) {
    if (Array.isArray(doc.fileUrl) && doc.fileUrl[0]?.url) return doc.fileUrl[0].url;
    if (typeof doc.fileUrl === "string") return doc.fileUrl;
  }
  if (Array.isArray(doc.responsible) && doc.responsible[0]?.url) {
    return doc.responsible[0].url;
  }
  return null;
};

export const FILTER_GROUPS = [
  { key: "projects", title: "Проекты", action: "get-projects" },
  { key: "roles", title: "По ролям", action: "get-roles" },
  { key: "directions", title: "Направления", action: "get-directions" },
  { key: "source", title: "Источники", action: "get-sources" },
] as const;

interface PortalContextType {
  loading: boolean;
  docs: any[];
  filterOptions: Record<string, FilterItem[]>;
  activeFilters: Record<string, Set<string>>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toggleFilter: (group: string, itemId: string) => void;
  setExclusiveFilter: (group: string, itemId: string) => void;
  clearFilters: () => void;
  chipCounts: Record<string, number>;
  filteredDocs: any[];
  stats: { label: string; value: number }[];
}

const PortalContext = createContext<PortalContextType | null>(null);

export const usePortal = () => {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
};

export const PortalProvider = ({ children }: { children: ReactNode }) => {
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

  const setExclusiveFilter = (group: string, itemId: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      const current = prev[group];
      if (current && current.size === 1 && current.has(itemId)) {
        next[group] = new Set();
      } else {
        next[group] = new Set([itemId]);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setActiveFilters({
      projects: new Set(),
      roles: new Set(),
      directions: new Set(),
      source: new Set(),
    });
  };

  return (
    <PortalContext.Provider value={{
      loading, docs, filterOptions, activeFilters, searchQuery,
      setSearchQuery, toggleFilter, setExclusiveFilter, clearFilters,
      chipCounts, filteredDocs, stats,
    }}>
      {children}
    </PortalContext.Provider>
  );
};
