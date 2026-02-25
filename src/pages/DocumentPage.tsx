import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_MAP, getStatusId, formatDate, extractFileUrl, extractLinkedNames } from "@/hooks/useDocuments";

const FUNC_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bpium-api`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const DocumentPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${FUNC_URL}?action=get-documents`, {
          headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (Array.isArray(data)) {
          const found = data.find((d: any) => String(d.id) === docId);
          setDoc(found || null);
        }
      } catch (e) {
        console.error("Failed to load document:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [docId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 bg-primary flex items-center px-4">
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад
          </Button>
          <span className="text-primary-foreground font-semibold ml-4">АТС Портал</span>
        </header>
        <div className="max-w-3xl mx-auto px-6 pt-12 text-center">
          <p className="text-muted-foreground text-lg">Документ не найден</p>
        </div>
      </div>
    );
  }

  const sid = getStatusId(doc);
  const st = STATUS_MAP[sid];
  const fileUrl = extractFileUrl(doc);
  const rolesText = extractLinkedNames(doc.roles);
  const directionsText = extractLinkedNames(doc.directions);
  const projectsText = extractLinkedNames(doc.projects);
  const isPdf = fileUrl?.toLowerCase().includes(".pdf");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 bg-primary flex items-center px-4">
        <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад
        </Button>
        <span className="text-primary-foreground font-semibold ml-4">АТС Портал</span>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground leading-relaxed mb-6">
          {doc.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 mb-8 text-sm text-muted-foreground">
          {doc.date && <span>{formatDate(doc.date)}</span>}
          {doc.version && <span>v{doc.version}</span>}
          {st && <Badge className={`${st.className} border-0`}>{st.label}</Badge>}
        </div>

        {/* Meta details */}
        <div className="space-y-2 mb-8 text-sm">
          {doc.responsible && (
            <div>
              <span className="text-muted-foreground">Ответственный: </span>
              <span className="text-foreground">
                {typeof doc.responsible === "string" ? doc.responsible : extractLinkedNames(doc.responsible)}
              </span>
            </div>
          )}
          {rolesText && (
            <div>
              <span className="text-muted-foreground">Роли: </span>
              <span className="text-foreground">{rolesText}</span>
            </div>
          )}
          {directionsText && (
            <div>
              <span className="text-muted-foreground">Направления: </span>
              <span className="text-foreground">{directionsText}</span>
            </div>
          )}
          {projectsText && (
            <div>
              <span className="text-muted-foreground">Проекты: </span>
              <span className="text-foreground">{projectsText}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {fileUrl && (
          <div className="flex gap-3 mb-8">
            <Button size="lg" onClick={() => window.open(fileUrl, "_blank")} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Открыть в браузере
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <a href={fileUrl} download>
                <Download className="w-4 h-4" />
                Скачать
              </a>
            </Button>
          </div>
        )}

        {/* Preview */}
        {fileUrl && (
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="px-4 py-2 border-b border-border text-sm text-muted-foreground">
              Предпросмотр
            </div>
            <iframe
              src={fileUrl}
              className="w-full h-[600px]"
              title="Предпросмотр документа"
            />
          </div>
        )}

        {/* Related docs placeholder */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">Связанные документы</h2>
          <p className="text-sm text-muted-foreground">Раздел в разработке</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;
