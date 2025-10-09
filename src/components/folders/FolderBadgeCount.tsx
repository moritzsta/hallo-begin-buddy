import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface FolderBadgeCountProps {
  count: number;
  folderId: string;
}

export const FolderBadgeCount = ({ count, folderId }: FolderBadgeCountProps) => {
  const { t } = useTranslation();

  if (count <= 0) return null;

  const displayCount = count >= 100 ? '99+' : count.toString();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Badge
              variant="default"
              className="ml-auto min-w-[24px] justify-center px-1.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label={t('folders.unreadBadgeLabel', { count })}
            >
              {displayCount}
            </Badge>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('folders.unreadBadgeTooltip', { count })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
