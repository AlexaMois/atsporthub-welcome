import { FUNC_URL, SUPABASE_ANON_KEY } from "@/lib/config";
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Download, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import PdfViewer from "@/components/portal/PdfViewer";
import OfficeViewer from "@/components/portal/OfficeViewer";
import { handleDownload } from "@/utils/fileUtils";
import {
  usePortal,
  getStatusId,
  STATUS_MAP,
  formatDate,
  extractLinkedNames,
  extractFileUrl,
} from "@/lib/portal-context";

const isPdf = (url: string): boolean => /\.pdf(\?|$)/i.test(url);
const isOffice = (url: string): boolean => /\.(docx?|xlsx?|pptx?)(\?|$)/i.test(url);

const DocumentPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/portal") ? "/portal" : "/dashboard/director";
  const { docs, loading } = usePortal();
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryMeta, setSummaryMeta] = useState<{ cached?: boolean; generatedAt?: string } | null>(null);

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
      const ANON_KEY = SUPABASE_ANON_KEY;

      const res = await fetch(`${FUNC_URL}?action=summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": ANON_KEY,
        },
        body: JSON.stringify({ docId: String(doc.id), fileUrl }),
      });

      if (!res.ok) throw new Error("Summarization failed");
      const data = await res.json();
      setSummary(data.summary);
      setSummaryMeta({ cached: data.cached, generatedAt: data.generatedAt });
      toast.success(data.cached ? "Саммари загружено из кеша" : "Саммари готово!");
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
            {summaryMeta?.cached && (
              <span className="text-xs font-normal text-muted-foreground">(из кеша)</span>
            )}
          </h3>
           <div className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-strong:text-foreground prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* File preview */}
      {fileUrl ? (
        <>
          {isPdf(fileUrl) ? (
            <div className="mb-6">
              <PdfViewer url={fileUrl} />
            </div>
          ) : isOffice(fileUrl) ? (
            <div className="mb-6">
              <OfficeViewer
                url={fileUrl}
                onDownload={() => handleDownload(fileUrl, doc.title, String(doc.id))}
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
              onClick={() => window.open(fileUrl, "_blank")}
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
            onClick={() => navigate(`${basePath}/doc/${prevDoc.id}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Предыдущий
          </Button>
        ) : <div />}
        
        {nextDoc ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`${basePath}/doc/${nextDoc.id}`)}
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
