import { useState, useEffect, useMemo } from "react";

interface LinkedObj {
  catalogId: string;
  recordId: string;
  recordTitle: string;
}

export interface FilterItem {
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

export const useDocuments = () => {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterItem[]>>({});

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

  return { docs, filterOptions, loading, chipCounts };
};

// Shared utilities
export const getStatusId = (doc: any): number => {
  if (Array.isArray(doc.status)) return parseInt(doc.status[0]) || 0;
  return Number(doc.status) || 0;
};

export const STATUS_MAP: Record<number, { label: string; className: string }> = {
  1: { label: "Черновик", className: "bg-muted text-muted-foreground" },
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
  { key: "projects", title: "Проекты" },
  { key: "roles", title: "По ролям" },
  { key: "directions", title: "Направления" },
  { key: "source", title: "Источники" },
] as const;
