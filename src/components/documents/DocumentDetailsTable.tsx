import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Trash2, Edit, FolderInput, Tags as TagsIcon, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listItem, getAnimationProps } from '@/lib/animations';

interface FileRecord {
  id: string;
  title: string;
  mime: string;
  size: number;
  storage_path: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  meta: any;
}

interface DocumentDetailsTableProps {
  files: FileRecord[];
  isNewFile: (file: FileRecord) => boolean;
  onDownload: (file: FileRecord) => void;
  onDelete: (fileId: string) => void;
  onRename: (file: FileRecord) => void;
  onMove: (fileId: string) => void;
  onEditTags: (file: FileRecord) => void;
  onPreview: (file: FileRecord) => void;
  formatFileSize: (bytes: number) => string;
}

export const DocumentDetailsTable = ({
  files,
  isNewFile,
  onDownload,
  onDelete,
  onRename,
  onMove,
  onEditTags,
  formatFileSize,
}: DocumentDetailsTableProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLifestyle = theme === 'lifestyle';

  const getFileTypeLabel = (mime: string): string => {
    if (mime.startsWith('image/')) return t('documents.typeImage');
    if (mime.startsWith('application/pdf')) return 'PDF';
    if (mime.includes('word') || mime.includes('document')) return t('documents.typeDocument');
    if (mime.includes('sheet') || mime.includes('excel')) return t('documents.typeSpreadsheet');
    if (mime.includes('presentation') || mime.includes('powerpoint')) return t('documents.typePresentation');
    return mime.split('/')[1]?.toUpperCase() || t('documents.typeOther');
  };

  const getFileTypeColor = (mime: string): string => {
    if (mime.startsWith('image/')) return 'text-blue-500';
    if (mime.startsWith('application/pdf')) return 'text-red-500';
    if (mime.includes('word') || mime.includes('document')) return 'text-blue-600';
    if (mime.includes('sheet') || mime.includes('excel')) return 'text-green-600';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      <AnimatePresence mode="popLayout">
        {files.map((file, index) => (
          <motion.div
            key={file.id}
            {...getAnimationProps(listItem)}
            custom={index}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            layout
          >
            <Card className="p-3 transition-all duration-200 hover:shadow-md border border-border/50">
              <div className="flex items-center gap-3">
                {/* File Name - Reduced width */}
                <div className="flex-[0.75] min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium truncate",
                      isNewFile(file) && "font-semibold"
                    )}>
                      {file.title}
                    </span>
                    {isNewFile(file) && (
                      <Badge 
                        variant={isLifestyle ? "lifestyle" : "default"} 
                        className="text-xs shrink-0 px-2 py-0.5"
                      >
                        {t('documents.new')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* File Type */}
                <div className="shrink-0">
                  <Badge 
                    variant="outline" 
                    className={cn("text-sm font-medium", getFileTypeColor(file.mime))}
                  >
                    {getFileTypeLabel(file.mime)}
                  </Badge>
                </div>

                {/* File Size */}
                <div className="shrink-0 w-16 text-right">
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatFileSize(file.size)}
                  </span>
                </div>

                {/* Tags - Increased width */}
                <div className="flex-[0.5] min-w-0">
                  {file.tags && file.tags.length > 0 ? (
                    <div className="flex gap-1.5 overflow-hidden flex-wrap">
                      {file.tags.slice(0, 3).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant={isLifestyle ? "lifestyle-secondary" : "secondary"}
                          className="text-sm truncate max-w-[120px] px-2 py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {file.tags.length > 3 && (
                        <Badge 
                          variant="outline" 
                          className="text-sm px-2 py-0.5 bg-muted/50"
                        >
                          +{file.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground/50">—</span>
                  )}
                </div>

                {/* Date */}
                <div className="shrink-0 w-24 text-right">
                  <span className="text-sm text-muted-foreground">
                    {new Date(file.created_at).toLocaleDateString(undefined, {
                      year: '2-digit',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* Actions Menu */}
                <div className="shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-md hover:bg-accent"
                      >
                        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-lg bg-popover border-2 border-border shadow-2xl backdrop-blur-md">
                      <DropdownMenuItem 
                        onClick={() => onDownload(file)} 
                        className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                      >
                        <Download className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{t('documents.download')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onRename(file)} 
                        className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                      >
                        <Edit className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{t('documents.rename')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onMove(file.id)} 
                        className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                      >
                        <FolderInput className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{t('documents.move')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onEditTags(file)} 
                        className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                      >
                        <TagsIcon className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{t('documents.editTags')}</span>
                      </DropdownMenuItem>
                      <div className="my-1 h-px bg-border" />
                      <DropdownMenuItem
                        onClick={() => onDelete(file.id)}
                        className="gap-2 text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="font-medium">{t('documents.delete')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
