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

const DocumentPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const { docs, loading } = usePortal();

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-gray-400 text-sm">Загрузка...</p>
      </div>
    );
  }

  const doc = docs.find((d) => String(d.id) === docId);

  if (!doc) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link to="/dashboard/director" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0099ff] mb-6">
          <ArrowLeft className="w-4 h-4" /> Назад к списку
        </Link>
        <p className="text-gray-400 text-sm">Документ не найден</p>
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
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0099ff] mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Назад к списку
      </Link>

      <h1 className="text-2xl font-bold text-[#0a1628] mb-4">{doc.title}</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-500">
        {st && <Badge className={`${st.className} border-0`}>{st.label}</Badge>}
        {doc.date && <span>Дата: {formatDate(doc.date)}</span>}
        {doc.version && <span>Версия: {doc.version}</span>}
      </div>

      {meta.length > 0 && (
        <div className="space-y-2 mb-8">
          {meta.map((m) => (
            <div key={m.label} className="flex gap-2 text-sm">
              <span className="text-gray-400 min-w-[120px] shrink-0">{m.label}:</span>
              <span className="text-[#0a1628]">{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {fileUrl && (
        <div className="flex gap-3">
          <Button
            onClick={() => window.open(fileUrl, "_blank")}
            className="bg-[#0099ff] hover:bg-[#0088ee] text-white gap-2"
          >
            <ExternalLink className="w-4 h-4" /> Открыть файл
          </Button>
          <Button
            variant="outline"
            asChild
          >
            <a href={fileUrl} download className="gap-2">
              <Download className="w-4 h-4" /> Скачать
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentPage;
