import { Link, useLocation } from "react-router-dom";
import { Loader2, Eye, Search, X, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  usePortal,
  getStatusId,
  STATUS_MAP,
  formatDate,
  extractFileUrl,
  FILTER_GROUPS,
} from "@/lib/portal-context";

interface LinkedObj {
  recordTitle: string;
}

const DocumentListPage = () => {
  const location = useLocation();
  const isEmployeePortal = location.pathname.startsWith("/portal");
  const isDirector = location.pathname.startsWith("/dashboard/director");
  const basePath = isEmployeePortal ? "/portal" : "/dashboard/director";

  const {
    loading, error, retry, filteredDocs, stats, searchQuery, setSearchQuery,
    activeFilters, toggleFilter, filterOptions,
  } = usePortal();

  // For phone-auth employees, don't show role filter chips (roles come from Bpium)
  const activeChips: { group: string; itemId: string; name: string }[] = [];
  for (const g of FILTER_GROUPS) {
    if (isEmployeePortal && g.key === "roles") continue;
    const sel = activeFilters[g.key];
    if (sel) {
      sel.forEach((id) => {
        const item = (filterOptions[g.key] || []).find((i) => i.id === id);
        if (item) activeChips.push({ group: g.key, itemId: id, name: item.name });
      });
    }
  }

  const extractRoleBadges = (doc: any) => {
    if (!Array.isArray(doc.roles)) return { visible: [], extra: 0 };
    const all = doc.roles.map((o: LinkedObj) => o.recordTitle).filter(Boolean);
    return { visible: all.slice(0, 3), extra: Math.max(0, all.length - 3) };
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-muted-foreground text-sm">Не удалось загрузить данные</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Повторить загрузку
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-foreground mb-6">
            {isEmployeePortal ? "Документы для вас" : "Все документы"}
          </h1>
          {isDirector && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border-l-4 border-primary pl-3">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Поиск по названию..."
              className="w-full h-11 pl-9 pr-4 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {activeChips.map((c) => (
                <button
                  key={`${c.group}:${c.itemId}`}
                  onClick={() => toggleFilter(c.group, c.itemId)}
                  className="flex items-center gap-1 text-xs px-3 py-2 min-h-[44px] rounded-full bg-primary text-primary-foreground"
                >
                  {c.name}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          {/* Document list */}
          <div>
            {filteredDocs.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-12">Документы не найдены</p>
            )}
            {filteredDocs.map((doc) => {
              const sid = getStatusId(doc);
              const st = STATUS_MAP[sid];
              const url = extractFileUrl(doc);
              const { visible: roleBadges, extra: roleExtra } = extractRoleBadges(doc);
              return (
                <div key={doc.id} className="py-4 border-b border-gray-100 hover:bg-gray-50 group relative flex items-start justify-between gap-2">
                  <Link
                    to={`${basePath}/doc/${doc.id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-[15px] sm:text-sm font-medium text-foreground group-hover:text-primary line-clamp-2 transition-colors">
                      {doc.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                      {doc.date && <span>{formatDate(doc.date)}</span>}
                      {roleBadges.map((name: string, i: number) => (
                        <span key={i} className="bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">{name}</span>
                      ))}
                      {roleExtra > 0 && (
                        <span className="bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">+{roleExtra}</span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {st && <Badge className={`${st.className} border-0 text-xs`}>{st.label}</Badge>}
                    {url && (
                      <Link
              to={`${basePath}/doc/${doc.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Eye className="w-4 h-4" />
            </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentListPage;
