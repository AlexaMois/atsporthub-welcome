import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Search, Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BpiumDocument {
  id: string;
  title: string;
  responsible: Array<{ url?: string; title?: string }>;
  directions: Array<{ recordId: string; recordTitle: string }>;
  roles: Array<{ recordId: string; recordTitle: string }>;
  projects: Array<{ recordId: string; recordTitle: string }>;
  fileUrl: unknown[];
  status: string[];
  source: Array<{ recordId: string; recordTitle: string }>;
  date: string;
  tags: string;
  version: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  "1": { label: "Черновик", variant: "secondary" },
  "2": { label: "На проверке", variant: "outline" },
  "3": { label: "Утверждён", variant: "default" },
  "4": { label: "Отклонён", variant: "destructive" },
};

const FUNC_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bpium-api`;

function getFileUrl(doc: BpiumDocument): string | null {
  // field 11 (fileUrl) first, then field 3 (responsible) as fallback
  if (Array.isArray(doc.fileUrl) && doc.fileUrl.length > 0) {
    const f = doc.fileUrl[0] as { url?: string };
    if (f?.url) return f.url;
  }
  if (Array.isArray(doc.responsible) && doc.responsible.length > 0) {
    const r = doc.responsible[0];
    if (r?.url) return r.url;
  }
  return null;
}

const RolePage = () => {
  const { roleName } = useParams<{ roleName: string }>();
  const decoded = decodeURIComponent(roleName || "");

  const [documents, setDocuments] = useState<BpiumDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${FUNC_URL}?action=get-documents`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        if (!res.ok) throw new Error("Ошибка загрузки документов");
        const data: BpiumDocument[] = await res.json();
        setDocuments(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Неизвестная ошибка");
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const filtered = useMemo(() => {
    const byRole = documents.filter((doc) =>
      doc.roles?.some((r) => r.recordTitle === decoded)
    );
    if (!search.trim()) return byRole;
    const q = search.toLowerCase();
    return byRole.filter((doc) => doc.title.toLowerCase().includes(q));
  }, [documents, decoded, search]);

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("ru-RU");
    } catch {
      return "—";
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <header className="h-14 bg-primary flex items-center px-5 gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Назад</span>
        </Link>
        <span className="text-white font-semibold text-sm">АТС Портал</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-4">
          Документы для: {decoded}
        </h1>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-10 text-destructive">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            {search ? "Ничего не найдено" : "Нет документов для этой роли"}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((doc) => {
              const fileUrl = getFileUrl(doc);
              const statusInfo = STATUS_MAP[doc.status?.[0]] || {
                label: "—",
                variant: "secondary" as const,
              };

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow"
                >
                  <FileText className="h-5 w-5 text-primary shrink-0" />

                  <div className="flex-1 min-w-0">
                    {fileUrl ? (
                      <button
                        onClick={() => window.open(fileUrl, "_blank")}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left truncate block w-full"
                      >
                        {doc.title}
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-foreground truncate block">
                        {doc.title}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(doc.date)}
                    </span>
                  </div>

                  <Badge variant={statusInfo.variant} className="shrink-0 text-[10px]">
                    {statusInfo.label}
                  </Badge>

                  {fileUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() => window.open(fileUrl, "_blank")}
                      title="Скачать"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default RolePage;
