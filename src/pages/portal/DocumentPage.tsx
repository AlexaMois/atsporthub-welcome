import { FUNC_URL, SUPABASE_ANON_KEY } from "@/lib/config";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { useBasePath } from "@/hooks/useBasePath";

const isPdf = (url: string): boolean => /\.pdf(\?|$)/i.test(url);
const isOffice = (url: string): boolean => /\.(docx?|xlsx?|pptx?)(\?|$)/i.test(url);

const DocumentPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const basePath = useBasePath();
  const { docs, loading } = usePortal();
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryMeta, setSummaryMeta] = useState<{ cached?: boolean; generatedAt?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'summary'>('preview');

  // Reset all summary state when navigating between documents
  useEffect(() => {
    setSummary(null);
    setSummaryMeta(null);
    setSummarizing(false);
    setActiveTab('preview');
  }, [docId]);

  const currentIndex = docs.findIndex((d) => String(d.id) === docId);
  const prevDoc = currentIndex > 0 ? docs[currentIndex - 1] : null;
  const nextDoc = currentIndex >= 0 && currentIndex < docs.length - 1 ? docs[currentIndex + 1] : null;

  if (loading && docs.length === 0) {
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

      const data = await res.json();
      if (!res.ok || (data.error && !data.summary)) {
        toast.error(data.error || data.summary || "Не удалось создать саммари.");
        return;
      }
      if (!data.summary) {
        toast.error("Саммари не создано — пустой ответ.");
        return;
      }
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

  // Теги — строка из Bpium, разбиваем по запятой
  const tagList: string[] = doc.tags
    ? String(doc.tags).split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  return (
    <div
      key={docId}
      className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden"
    >
      {/* Left column */}
      <div className="w-full md:w-1/2 flex flex-col md:border-r shrink-0 md:shrink">
        {/* Scrollable metadata area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-2 space-y-4">
          <h1 className="text-xl font-bold text-foreground leading-tight">{doc.title}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {st && <Badge className={`${st.className} border-0`}>{st.label}</Badge>}
            {doc.date && <span>Дата: {formatDate(doc.date)}</span>}
            {doc.version && <span>Версия: {doc.version}</span>}
          </div>

          {meta.length > 0 && (
            <div className="space-y-2">
              {meta.map((m) => (
                <div key={m.label} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground min-w-[120px] shrink-0">{m.label}:</span>
                  <span className="text-foreground">{m.value}</span>
                </div>
              ))}
            </div>
          )}

          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sticky bottom actions — always visible */}
        <div className="p-6 pt-3 border-t space-y-3 shrink-0">
          {fileUrl && (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => window.open(fileUrl, "_blank")}
                className="w-full min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Открыть файл
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDownload(fileUrl, doc.title, String(doc.id))}
                className="w-full min-h-[44px] gap-2 hover:bg-primary hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" /> Скачать
              </Button>
            </div>
          )}

          <Separator />

          {/* Prev / Next navigation */}
          <div className="flex justify-between">
            {prevDoc ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(`${basePath}/doc/${prevDoc.id}`)}
                className="gap-1 min-h-[44px] min-w-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Предыдущий
              </Button>
            ) : <div />}
            {nextDoc ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(`${basePath}/doc/${nextDoc.id}`)}
                className="gap-1 min-h-[44px] min-w-[44px]"
              >
                Следующий <ArrowRight className="w-4 h-4" />
              </Button>
            ) : <div />}
          </div>

          <div className="text-xs text-muted-foreground pt-1">
            Последнее обновление: {formatDate(doc.date)}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full md:w-1/2 flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
        {/* Tab bar */}
        <div className="flex border-b shrink-0">
          <button
            type="button"
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('preview')}
          >
            Предпросмотр
          </button>
          <button
            type="button"
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            Саммари ИИ
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'preview' && (
            <div className="h-full overflow-y-auto">
              {fileUrl ? (
                <>
                  {isPdf(fileUrl) ? (
                    <PdfViewer url={fileUrl} className="h-full" />
                  ) : isOffice(fileUrl) ? (
                    <OfficeViewer
                      url={fileUrl}
                      className="h-full"
                      onDownload={() => handleDownload(fileUrl, doc.title, String(doc.id))}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">
                        Предпросмотр недоступен для этого типа файла.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">Файл не прикреплён</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="h-full overflow-y-auto">
              {!summary && !summarizing && (
                <div className="flex items-center justify-center h-full">
                  <Button
                    type="button"
                    onClick={handleSummarize}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <FileText className="w-4 h-4" /> Создать саммари ИИ
                  </Button>
                </div>
              )}

              {summarizing && (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Создаю саммари...</p>
                </div>
              )}

              {summary && (
                <div className="p-6">
                  <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden">
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
                  {summaryMeta?.generatedAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Сгенерировано: {summaryMeta.generatedAt}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;
