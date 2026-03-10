import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Download, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  usePortal,
  getStatusId,
  STATUS_MAP,
  formatDate,
  extractLinkedNames,
  extractFileUrl,
} from "@/lib/portal-context";

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

const getViewUrl = (url: string): string => {
  const lower = url.toLowerCase();
  if (lower.match(/\.(docx?|xlsx?|pptx?)(\?|$)/)) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
};

const isPdf = (url: string): boolean => /\.pdf(\?|$)/i.test(url);
const isOffice = (url: string): boolean => /\.(docx?|xlsx?|pptx?)(\?|$)/i.test(url);

const DocumentPage = () => {
  const { docId, roleName } = useParams<{ docId: string; roleName?: string }>();
  const navigate = useNavigate();
  const { docs, loading } = usePortal();
  const [showPreview, setShowPreview] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const currentIndex = docs.findIndex((d) => String(d.id) === docId);
  const prevDoc = currentIndex > 0 ? docs[currentIndex - 1] : null;
  const nextDoc = currentIndex >= 0 && currentIndex < docs.length - 1 ? docs[currentIndex + 1] : null;

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
        <p className="text-muted-foreground text-sm">Документ не найден</p>
      </div>
    );
  }

  const sid = getStatusId(doc);
  const st = STATUS_MAP[sid];
  const fileUrl = extractFileUrl(doc);

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummary(null);
    try {
      const FUNC_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bpium-api`;
      const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${FUNC_URL}?action=summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": ANON_KEY,
        },
        body: JSON.stringify({ docId }),
      });

      if (!res.ok) throw new Error("Summarization failed");
      const data = await res.json();
      setSummary(data.summary);
      toast.success("Саммари готово!");
    } catch (err) {
      console.error(err);
      toast.error("Не удалось создать саммари.");
    } finally {
      setSummarizing(false);
    }
  };

  const meta = [
    { label: "Направления", value: extractLinkedNames(doc.directions) },
    { label: "Роли", value: extractLinkedNames(doc.roles) },
    { label: "Проекты", value: extractLinkedNames(doc.projects) },
    { label: "Источник", value: extractLinkedNames(doc.source) },
  ].filter((m) => m.value);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight">{doc.title}</h1>
      
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

      {/* Саммари блок */}
      {summary && (
        <div className="mb-8 p-5 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <h3 className="text-primary font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> ИИ-Резюме документа
          </h3>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      )}

      {/* File preview */}
      {fileUrl ? (
        <>
          {(isPdf(fileUrl) || isOffice(fileUrl)) ? (
            <div className="mb-6">
              <iframe
                src={getViewUrl(fileUrl)}
                className="w-full h-[350px] sm:h-[600px] rounded-lg border border-gray-200"
                title="Предпросмотр документа"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              Предпросмотр недоступен для этого типа файла.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button
              type="button"
              onClick={() => window.open(getViewUrl(fileUrl), "_blank")}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Открыть файл
            </Button>
            
            <Button
              type="button"
              onClick={handleSummarize}
              disabled={summarizing}
              variant="secondary"
              className="w-full sm:w-auto gap-2 bg-white border border-primary/20 hover:bg-primary/5 text-primary"
            >
              {summarizing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {summarizing ? "Создаю саммари..." : "Саммари ИИ"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleDownload(fileUrl, doc.title, String(doc.id))}
              className="w-full sm:w-auto gap-2 hover:bg-primary hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" /> Скачать
            </Button>
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-center py-8">Файл не прикреплён</p>
      )}

      <Separator className="my-8" />
      
      <div className="text-xs text-muted-foreground mb-4">
        Последнее обновление: {formatDate(doc.date)}
      </div>

      {/* Prev / Next navigation */}
      <div className="flex justify-between mt-8">
        {prevDoc ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(roleName 
              ? `/role/${encodeURIComponent(roleName)}/doc/${prevDoc.id}` 
              : `/dashboard/director/doc/${prevDoc.id}`
            )}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Предыдущий
          </Button>
        ) : <div />}
        
        {nextDoc ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(roleName 
              ? `/role/${encodeURIComponent(roleName)}/doc/${nextDoc.id}` 
              : `/dashboard/director/doc/${nextDoc.id}`
            )}
            className="gap-2"
          >
            Следующий <ArrowRight className="w-4 h-4" />
          </Button>
        ) : <div />}
      </div>
    </div>
  );
};

export default DocumentPage;
