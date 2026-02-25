import { Link } from "react-router-dom";
import { Loader2, Download, Search, X } from "lucide-react";
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

const sanitizeFilename = (name: string): string => {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 200)
    .replace(/^\.+/, "_") || "document";
};

const getExtensionFromUrl = (url: string): string => {
  const match = url.match(/\.([a-zA-Z0-9]{1,5})(?:\?|$)/);
  return match ? `.${match[1].toLowerCase()}` : "";
};

const buildDownloadFilename = (title: string | undefined, docId: string | undefined, url: string): string => {
  let base = "";
  if (title && typeof title === "string" && title.trim().length > 0) {
    base = title.trim();
  } else if (docId) {
    base = `document_${docId}`;
  } else {
    base = "document";
  }
  const ext = getExtensionFromUrl(url);
  if (ext && !base.toLowerCase().endsWith(ext)) {
    base += ext;
  }
  return sanitizeFilename(base);
};

const handleDownload = async (url: string, title?: string, docId?: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = buildDownloadFilename(title, docId, url);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 100);
  } catch {
    const a = document.createElement("a");
    a.href = url;
    a.download = buildDownloadFilename(title, docId, url);
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

const DocumentListPage = () => {
  const {
    loading, filteredDocs, stats, searchQuery, setSearchQuery,
    activeFilters, toggleFilter, filterOptions,
  } = usePortal();

  const activeChips: { group: string; itemId: string; name: string }[] = [];
  for (const g of FILTER_GROUPS) {
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
          <Loader2 className="w-8 h-8 animate-spin text-[#0099ff]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-[#0099ff] pl-3">
                <div className="text-2xl font-bold text-[#0a1628]">{s.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{s.label}</div>
              </div>
            ))}
          </div>

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

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {activeChips.map((c) => (
                <button
                  key={`${c.group}:${c.itemId}`}
                  onClick={() => toggleFilter(c.group, c.itemId)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#0099ff] text-white"
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
                    to={`/dashboard/director/doc/${doc.id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium text-[#0a1628] group-hover:text-[#0099ff] line-clamp-2 transition-colors">
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
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(url, doc.title, String(doc.id)); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-1"
                      >
                        <Download className="w-4 h-4" />
                      </button>
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
