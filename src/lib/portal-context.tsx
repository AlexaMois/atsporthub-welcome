import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { apiCall } from "@/lib/api";

export interface LinkedObj {
  catalogId: string;
  recordId: string;
  recordTitle: string;
}

interface FilterItem {
  id: string;
  name: string;
}

// Роль "Все сотрудники" — специальное значение, означает "показать всё"
const ALL_EMPLOYEES_ROLE = "Все сотрудники";

// Привилегированные роли — видят ВСЕ документы без фильтрации по роли
const PRIVILEGED_ROLES = [
  "генеральный директор",
  "начальник участка / руководитель проекта",
  "все сотрудники",
];

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
  error: boolean;
  retry: () => void;
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
  isAllEmployeesMode: boolean;
}

const PortalContext = createContext<PortalContextType | null>(null);

export const usePortal = () => {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
};

export const PortalProvider = ({ children, roleName, userRoles }: { children: ReactNode; roleName?: string; userRoles?: string[] }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterItem[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({
    projects: new Set(),
    roles: new Set(),
    directions: new Set(),
    source: new Set(),
  });

  // Флаг: привилегированная роль = показываем все документы без фильтра по роли
  const isAllEmployeesMode =
    roleName?.toLowerCase() === ALL_EMPLOYEES_ROLE.toLowerCase() ||
    (userRoles?.some((ur) => PRIVILEGED_ROLES.includes(ur.toLowerCase())) ?? false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const results = await Promise.allSettled([
        apiCall("get-documents", undefined, "GET"),
        apiCall("get-roles", undefined, "GET"),
        apiCall("get-projects", undefined, "GET"),
        apiCall("get-directions", undefined, "GET"),
        apiCall("get-sources", undefined, "GET"),
      ]);
      const val = (i: number) => {
        const r = results[i];
        return r.status === "fulfilled" && r.value.ok ? r.value.data : [];
      };
      const docsData = val(0);
      if (Array.isArray(docsData)) setDocs(docsData);
      const toItems = (data: any): FilterItem[] =>
        Array.isArray(data) ? data.map((r: any) => ({ id: String(r.id), name: r.name || `#${r.id}` })) : [];
      setFilterOptions({
        projects: toItems(val(2)),
        roles: toItems(val(1)),
        directions: toItems(val(3)),
        source: toItems(val(4)),
      });
    } catch (e) {
      console.error("Failed to load data:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-apply role filter for employee view
  useEffect(() => {
    if (!filterOptions.roles?.length) return;
    if (isAllEmployeesMode) return;

    if (userRoles && userRoles.length > 0) {
      const matchedIds = filterOptions.roles
        .filter((r) => userRoles.some((ur) => ur.toLowerCase() === r.name.toLowerCase()))
        .map((r) => r.id);
      if (matchedIds.length > 0) {
        setActiveFilters((prev) => ({ ...prev, roles: new Set(matchedIds) }));
      }
      return;
    }

    if (roleName) {
      const match = filterOptions.roles.find(
        (r) => r.name.toLowerCase() === roleName.toLowerCase()
      );
      if (match) setExclusiveFilter("roles", match.id);
    }
  }, [filterOptions.roles, roleName, userRoles, isAllEmployeesMode]);

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
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = doc.title?.toLowerCase().includes(q);
        const inTags = typeof doc.tags === 'string'
          ? doc.tags.toLowerCase().includes(q)
          : Array.isArray(doc.tags)
          ? doc.tags.some((t: any) => String(t).toLowerCase().includes(q))
          : false;
        if (!inTitle && !inTags) return false;
      }

      for (const g of FILTER_GROUPS) {
        if (g.key === "roles" && isAllEmployeesMode) continue;
        const sel = activeFilters[g.key];
        if (sel && sel.size > 0) {
          const docField = doc[g.key];
          if (!Array.isArray(docField) || !docField.some((o: LinkedObj) => sel.has(o.recordId))) return false;
        }
      }
      return true;
    });
  }, [docs, activeFilters, searchQuery, isAllEmployeesMode]);

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
      loading, error, retry: load, docs, filterOptions, activeFilters, searchQuery,
      setSearchQuery, toggleFilter, setExclusiveFilter, clearFilters,
      chipCounts, filteredDocs, stats, isAllEmployeesMode,
    }}>
      {children}
    </PortalContext.Provider>
  );
};
