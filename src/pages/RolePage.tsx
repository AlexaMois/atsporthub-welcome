import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DocumentLayout from "@/components/DocumentLayout";
import { useDocuments, getStatusId, STATUS_MAP, formatDate, FILTER_GROUPS } from "@/hooks/useDocuments";

interface LinkedObj {
  catalogId: string;
  recordId: string;
  recordTitle: string;
}

const RolePage = () => {
  const { roleName } = useParams<{ roleName: string }>();
  const decoded = decodeURIComponent(roleName || "");
  const navigate = useNavigate();
  const { docs, filterOptions, loading } = useDocuments();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({
    projects: new Set(),
    roles: new Set(),
    directions: new Set(),
    source: new Set(),
  });

  // Auto-set role filter on mount when filterOptions load
  useEffect(() => {
    const roles = filterOptions.roles || [];
    const match = roles.find((r) => r.name === decoded);
    if (match) {
      setActiveFilters((prev) => ({
        ...prev,
        roles: new Set([match.id]),
      }));
    }
  }, [filterOptions.roles, decoded]);

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

  const handleFilterSelect = (group: string, itemId: string | null) => {
    if (group === "__reset") {
      setActiveFilters({
        projects: new Set(),
        roles: new Set(),
        directions: new Set(),
        source: new Set(),
      });
      return;
    }
    setActiveFilters((prev) => {
      const next = { ...prev };
      const s = new Set(prev[group]);
      if (itemId === null) {
        s.clear();
      } else if (s.has(itemId)) {
        s.delete(itemId);
      } else {
        s.clear();
        s.add(itemId);
      }
      next[group] = s;
      return next;
    });
  };

  return (
    <DocumentLayout
      title={decoded}
      filterOptions={filterOptions}
      activeFilters={activeFilters}
      onFilterSelect={handleFilterSelect}
    >
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Поиск по названию..."
            className="w-full h-12 pl-9 pr-4 text-base border border-input rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Document list */}
        <div>
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {!loading && filteredDocs.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Документы не найдены</p>
          )}
          {filteredDocs.map((doc) => {
            const sid = getStatusId(doc);
            const st = STATUS_MAP[sid];
            return (
              <div
                key={doc.id}
                onClick={() => navigate(`/document/${doc.id}`)}
                className="py-5 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors px-2 -mx-2 rounded"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base font-medium text-foreground leading-relaxed line-clamp-2 flex-1">
                    {doc.title}
                  </p>
                  {st && (
                    <Badge className={`${st.className} border-0 text-xs shrink-0`}>{st.label}</Badge>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {doc.date && <span>{formatDate(doc.date)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DocumentLayout>
  );
};

export default RolePage;
