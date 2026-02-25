import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DocumentLayout from "@/components/DocumentLayout";
import { useDocuments, getStatusId, STATUS_MAP, formatDate, FILTER_GROUPS } from "@/hooks/useDocuments";

interface LinkedObj {
  catalogId: string;
  recordId: string;
  recordTitle: string;
}

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const { docs, filterOptions, loading, chipCounts } = useDocuments();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({
    projects: new Set(),
    roles: new Set(),
    directions: new Set(),
    source: new Set(),
  });

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
      { label: "Всего документов", shortLabel: "Всего", value: docs.length },
      { label: "Утверждено", shortLabel: "Утв.", value: approved },
      { label: "На согласовании", shortLabel: "Согл.", value: inReview },
      { label: "Новых за месяц", shortLabel: "Новых", value: newThisMonth },
    ];
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
      title="Генеральный директор"
      filterOptions={filterOptions}
      activeFilters={activeFilters}
      onFilterSelect={handleFilterSelect}
    >
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Stats — director only */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-8">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            stats.map((s) => (
              <div key={s.label} className="bg-card rounded-lg p-3 md:p-4 shadow-sm border-l-4 border-primary">
                <div className="text-lg md:text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  <span className="hidden md:inline">{s.label}</span>
                  <span className="md:hidden">{s.shortLabel}</span>
                </div>
              </div>
            ))
          )}
        </div>

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

export default DirectorDashboard;
