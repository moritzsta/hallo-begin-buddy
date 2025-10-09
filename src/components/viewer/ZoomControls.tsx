import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToWidth: () => void;
  onZoom100: () => void;
}

export const ZoomControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToWidth,
  onZoom100,
}: ZoomControlsProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onZoomOut}
              disabled={zoom <= 0.5}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('viewer.zoomOut')}</p>
          </TooltipContent>
        </Tooltip>

        <Button
          variant="ghost"
          size="sm"
          onClick={onZoom100}
          className="h-8 px-3 min-w-[60px] font-mono text-xs"
        >
          {Math.round(zoom * 100)}%
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onZoomIn}
              disabled={zoom >= 3}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('viewer.zoomIn')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFitToWidth}
              className="h-8 w-8"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('viewer.fitToWidth')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
