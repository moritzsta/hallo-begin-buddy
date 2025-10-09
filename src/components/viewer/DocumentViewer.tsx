import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageThumbnails } from './PageThumbnails';
import { ZoomControls } from './ZoomControls';

interface DocumentViewerProps {
  fileId: string | null;
  fileName: string;
  mimeType: string;
  onClose: () => void;
}

export const DocumentViewer = ({ fileId, fileName, mimeType, onClose }: DocumentViewerProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  const isOffice = mimeType.includes('word') || mimeType.includes('sheet') || mimeType.includes('presentation');
  const isMultiPage = isPdf || isOffice;

  useEffect(() => {
    if (!fileId) return;

    const loadDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        // For images and PDFs, get signed URL directly
        if (isImage || isPdf) {
          const { data, error: urlError } = await supabase.functions.invoke('generate-signed-url', {
            body: {
              fileId: fileId,
              expiresIn: 3600,
            },
          });

          if (urlError) throw urlError;
          setSignedUrl(data.signedUrl);
          setTotalPages(1);
        } else if (isOffice) {
          // For Office files, get preview
          const { data, error: previewError } = await supabase.functions.invoke('generate-preview', {
            body: { file_id: fileId },
          });

          if (previewError) throw previewError;
          
          if (!data.success) {
            throw new Error(data.message || 'Preview generation failed');
          }
          
          setPreviewUrl(data.preview_url);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error loading document:', err);
        setError(err instanceof Error ? err.message : t('common.error'));
        toast({
          title: t('documents.downloadError'),
          description: err instanceof Error ? err.message : t('common.unknownError'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [fileId, mimeType, isImage, t, toast]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleFitToWidth = () => setZoom(1);
  const handleZoom100 = () => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoom > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleDownload = async () => {
    try {
      const url = signedUrl || previewUrl;
      if (!url) return;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();

      toast({
        title: t('documents.downloadStarted'),
        description: t('documents.downloadStartedDesc', { filename: fileName }),
      });
    } catch (err) {
      toast({
        title: t('documents.downloadError'),
        description: err instanceof Error ? err.message : t('common.unknownError'),
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onClose]);

  const displayUrl = signedUrl || previewUrl;

  return (
    <Dialog open={!!fileId} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
        {/* Header Toolbar */}
        <DialogHeader className="px-4 py-2 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
            <DialogTitle className="text-lg font-semibold truncate">
              {fileName}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2">
            <ZoomControls
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitToWidth={handleFitToWidth}
              onZoom100={handleZoom100}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {t('documents.download')}
            </Button>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Thumbnails Sidebar (for multi-page documents) */}
          {isMultiPage && totalPages > 1 && (
            <PageThumbnails
              currentPage={currentPage}
              totalPages={totalPages}
              onPageSelect={setCurrentPage}
              previewUrl={displayUrl}
            />
          )}

          {/* Canvas Area */}
          <div className="flex-1 relative bg-muted/30 overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-center text-muted-foreground max-w-md">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  {t('common.retry')}
                </Button>
              </div>
            )}

            {!loading && !error && displayUrl && (
              <div
                ref={containerRef}
                className={cn(
                  "w-full h-full flex items-center justify-center overflow-hidden",
                  zoom > 1 && "cursor-move"
                )}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {isPdf ? (
                  <iframe
                    src={`${displayUrl}#view=FitH`}
                    title={fileName}
                    className="w-full h-full"
                  />
                ) : (
                  <motion.div
                    animate={{
                      scale: zoom,
                      x: panPosition.x,
                      y: panPosition.y,
                    }}
                    transition={{ type: 'tween', duration: 0.2 }}
                    className="max-w-full max-h-full"
                  >
                    <img
                      ref={imageRef}
                      src={displayUrl}
                      alt={fileName}
                      className="max-w-full max-h-full object-contain shadow-2xl"
                      draggable={false}
                    />
                  </motion.div>
                )}
              </div>
            )}

            {/* Page Navigation (for multi-page) */}
            {isMultiPage && totalPages > 1 && !loading && !error && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-3">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
