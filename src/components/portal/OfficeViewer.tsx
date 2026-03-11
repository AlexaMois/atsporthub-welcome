import { useState, useEffect, useRef } from "react";
import { ExternalLink, Download, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface OfficeViewerProps {
  url: string;
  onDownload?: () => void;
}

const OfficeViewer = ({ url, onDownload }: OfficeViewerProps) => {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(isMobile ? "idle" : "loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  useEffect(() => {
    if (status === "loading") {
      // Google Viewer doesn't fire onerror reliably — timeout fallback
      timerRef.current = setTimeout(() => {
        setStatus("error");
      }, 15000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status]);

  const handleLoad = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("loaded");
  };

  if (status === "idle") {
    return (
      <div className="border border-border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center h-[200px]">
        <Button
          variant="outline"
          onClick={() => setStatus("loading")}
          className="gap-2"
        >
          <Loader2 className="w-4 h-4" />
          Загрузить предпросмотр
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border border-border rounded-lg overflow-hidden bg-muted/30 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Предпросмотр недоступен. Используйте кнопки ниже.
          </p>
          <div className="flex gap-3">
            <Button
              size="sm"
              onClick={() => window.open(url, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Открыть
            </Button>
            {onDownload && (
              <Button size="sm" variant="outline" onClick={onDownload} className="gap-2">
                <Download className="w-4 h-4" /> Скачать
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-muted/30 relative">
      {status === "loading" && (
        <div className="absolute inset-0 z-10 p-4 space-y-3 bg-muted/30">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-[350px] w-full" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={viewerUrl}
        className="w-full h-[500px] border-0"
        onLoad={handleLoad}
        onError={() => setStatus("error")}
        title="Document preview"
      />
    </div>
  );
};

export default OfficeViewer;
