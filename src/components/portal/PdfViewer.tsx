import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
}

const PdfViewer = ({ url }: PdfViewerProps) => {
  const isMobile = useIsMobile();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(false);
  const [manualLoad, setManualLoad] = useState(isMobile);

  const pageWidth = Math.min(720, (typeof window !== "undefined" ? window.innerWidth : 720) - 80);

  const handleLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setLoading(false);
  }, []);

  if (manualLoad) {
    return (
      <div className="border border-border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center h-[200px]">
        <Button
          variant="outline"
          onClick={() => setManualLoad(false)}
          className="gap-2"
        >
          <Loader2 className="w-4 h-4" />
          Загрузить предпросмотр PDF
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
      {loading && (
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      )}

      <Document
        file={url}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={() => {
          setError(true);
          setLoading(false);
        }}
        loading={null}
      >
        {!error && !loading && (
          <div className="relative">
            {pageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              className="mx-auto"
              onRenderSuccess={() => setPageLoading(false)}
              loading={null}
            />
          </div>
        )}
      </Document>

      {error && (
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          Не удалось загрузить PDF. Попробуйте скачать файл.
        </div>
      )}

      {!error && !loading && numPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-3 border-t border-border bg-background">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pageNumber <= 1}
            onClick={() => { setPageLoading(true); setPageNumber((p) => p - 1); }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {pageNumber} / {numPages}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pageNumber >= numPages}
            onClick={() => { setPageLoading(true); setPageNumber((p) => p + 1); }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
