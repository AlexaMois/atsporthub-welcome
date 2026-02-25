import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  usePortal,
  getStatusId,
  STATUS_MAP,
  formatDate,
  extractLinkedNames,
  extractFileUrl,
} from "@/lib/portal-context";

const getViewUrl = (url: string): string => {
  const lower = url.toLowerCase();
  if (lower.match(/\.(docx?|xlsx?|pptx?)(\?|$)/)) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
};

const handleDownload = async (url: string, filename?: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || url.split("/").pop() || "document";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank");
  }
};

const DocumentPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const { docs, loading } = usePortal();

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-muted-foreground text-sm">Загрузка...</p>
      </div>
    );
  }

  const doc = docs.find((d) => String(d.id) === docId);

  if (!doc) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link to="/dashboard/director" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Назад к списку
        </Link>
        <p className="text-muted-foreground text-sm">Документ не найден</p>
      </div>
    );
  }

  const sid = getStatusId(doc);
  const st = STATUS_MAP[sid];
  const fileUrl = extractFileUrl(doc);

  const meta = [
    { label: "Направления", value: extractLinkedNames(doc.directions) },
    { label: "Роли", value: extractLinkedNames(doc.roles) },
    { label: "Проекты", value: extractLinkedNames(doc.projects) },
    { label: "Источник", value: extractLinkedNames(doc.source) },
  ].filter((m) => m.value);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link
        to="/dashboard/director"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Назад к списку
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-4">{doc.title}</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted-foreground">
        {st && <Badge className={`${st.className} border-0`}>{st.label}</Badge>}
        {doc.date && <span>Дата: {formatDate(doc.date)}</span>}
        {doc.version && <span>Версия: {doc.version}</span>}
      </div>

      {meta.length > 0 && (
        <div className="space-y-2 mb-8">
          {meta.map((m) => (
            <div key={m.label} className="flex gap-2 text-sm">
              <span className="text-muted-foreground min-w-[120px] shrink-0">{m.label}:</span>
              <span className="text-foreground">{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {fileUrl && (
        <div className="flex gap-3">
          <Button
            onClick={() => window.open(getViewUrl(fileUrl), "_blank")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <ExternalLink className="w-4 h-4" /> Открыть файл
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDownload(fileUrl, doc.title)}
            className="gap-2"
          >
            <Download className="w-4 h-4" /> Скачать
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentPage;
