import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PageThumbnailsProps {
  currentPage: number;
  totalPages: number;
  onPageSelect: (page: number) => void;
  previewUrl: string | null;
}

export const PageThumbnails = ({
  currentPage,
  totalPages,
  onPageSelect,
  previewUrl,
}: PageThumbnailsProps) => {
  return (
    <div className="w-32 border-r bg-muted/30 flex flex-col">
      <div className="p-3 border-b">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          Pages
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageSelect(page)}
              className={cn(
                "w-full aspect-[3/4] rounded-lg border-2 overflow-hidden transition-all",
                "hover:border-primary/50 hover:shadow-md",
                currentPage === page
                  ? "border-primary shadow-lg ring-2 ring-primary/20"
                  : "border-border"
              )}
            >
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={`Page ${page}`}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-1 right-1 bg-background/90 rounded px-1.5 py-0.5">
                <span className="text-[10px] font-medium">{page}</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
