import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTheme } from 'next-themes';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Trash2, Edit, FolderInput, Tags as TagsIcon, Eye, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  maxWidth?: number;
  resizable: boolean;
}

export const DocumentDetailsTable = ({
  files,
  isNewFile,
  onDownload,
  onDelete,
  onRename,
  onMove,
  onEditTags,
  onPreview,
  formatFileSize,
}: DocumentDetailsTableProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLifestyle = theme === 'lifestyle';
  const parentRef = useRef<HTMLDivElement>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'name', label: t('documents.name'), width: 400, minWidth: 200, resizable: true },
    { key: 'type', label: t('documents.type'), width: 150, minWidth: 100, resizable: true },
    { key: 'size', label: t('documents.size'), width: 120, minWidth: 80, resizable: true },
    { key: 'tags', label: t('documents.tags'), width: 300, minWidth: 150, resizable: true },
    { key: 'date', label: t('documents.date'), width: 180, minWidth: 120, resizable: true },
    { key: 'actions', label: '', width: 50, minWidth: 50, resizable: false },
  ]);

  const [resizing, setResizing] = useState<{ columnKey: string; startX: number; startWidth: number } | null>(null);

  // Virtual scrolling with adjusted row size for spacing
  const rowVirtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Increased from 40 to account for spacing
    overscan: 10,
  });

  // Handle row selection with Shift/Ctrl
  const handleRowClick = (index: number, event: React.MouseEvent) => {
    const fileId = files[index].id;

    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      const newSelection = new Set(selectedRows);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      setSelectedRows(newSelection);
      setLastSelectedIndex(index);
    } else if (event.shiftKey && lastSelectedIndex !== -1) {
      // Range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelection = new Set(selectedRows);
      for (let i = start; i <= end; i++) {
        newSelection.add(files[i].id);
      }
      setSelectedRows(newSelection);
    } else {
      // Single selection
      setSelectedRows(new Set([fileId]));
      setLastSelectedIndex(index);
    }
    setFocusedIndex(index);
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (files.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, files.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < files.length) {
          onPreview(files[focusedIndex]);
        }
        break;
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setSelectedRows(new Set(files.map(f => f.id)));
        }
        break;
      case 'Escape':
        event.preventDefault();
        setSelectedRows(new Set());
        break;
    }
  };

  // Column resizing
  const handleMouseDown = (columnKey: string, event: React.MouseEvent) => {
    const column = columns.find(c => c.key === columnKey);
    if (!column || !column.resizable) return;

    event.preventDefault();
    setResizing({
      columnKey,
      startX: event.clientX,
      startWidth: column.width,
    });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const column = columns.find(c => c.key === resizing.columnKey);
      if (!column) return;

      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(
        column.minWidth,
        Math.min(column.maxWidth || Infinity, resizing.startWidth + delta)
      );

      setColumns(prev =>
        prev.map(c =>
          c.key === resizing.columnKey ? { ...c, width: newWidth } : c
        )
      );
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, columns]);

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

  const totalWidth = useMemo(() => columns.reduce((sum, col) => sum + col.width, 0), [columns]);

  return (
    <div className="relative">
      <div
        ref={parentRef}
        className="overflow-auto rounded-xl bg-background"
        style={{ height: '600px' }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="grid"
        aria-label={t('documents.documentList')}
      >
        {/* Sticky Header */}
        <div
          className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30 flex px-2 py-3"
          style={{ minWidth: totalWidth }}
        >
          {columns.map((column, idx) => (
            <div
              key={column.key}
              className="relative flex items-center px-4 py-1 text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
              style={{ width: column.width, minWidth: column.minWidth }}
              role="columnheader"
            >
              <span className="truncate">{column.label}</span>
              {column.resizable && (
                <div
                  className={cn(
                    "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors",
                    "hover:bg-primary/30 active:bg-primary/60",
                    resizing?.columnKey === column.key && "bg-primary/60"
                  )}
                  onMouseDown={(e) => handleMouseDown(column.key, e)}
                  role="separator"
                  aria-label={t('common.resize')}
                />
              )}
            </div>
          ))}
        </div>

        {/* Virtual Rows */}
        <div
          className="px-2 py-2"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
            minWidth: totalWidth,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const file = files[virtualRow.index];
            const isSelected = selectedRows.has(file.id);
            const isFocused = focusedIndex === virtualRow.index;
            const isNew = isNewFile(file);

            return (
              <ContextMenu key={file.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "absolute top-0 left-0 w-full flex items-center rounded-lg border border-border/50 bg-card transition-all duration-200 cursor-pointer group mb-2",
                      isSelected && "bg-primary/10 border-primary/30 shadow-md",
                      isFocused && "ring-2 ring-primary/50 ring-inset",
                      !isSelected && "hover:shadow-md hover:border-border"
                    )}
                    style={{
                      height: `${virtualRow.size - 8}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      minWidth: `calc(${totalWidth}px - 16px)`,
                    }}
                    onClick={(e) => handleRowClick(virtualRow.index, e)}
                    role="row"
                    aria-selected={isSelected}
                    aria-rowindex={virtualRow.index + 1}
                  >
                    {/* Name */}
                    <div
                      className="px-4 py-3 flex items-center gap-3"
                      style={{ width: columns[0].width, minWidth: columns[0].minWidth }}
                      role="gridcell"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={cn(
                          "truncate font-medium transition-colors",
                          isNew && "font-semibold"
                        )}>
                          {file.title}
                        </span>
                        {isNew && (
                          <Badge 
                            variant={isLifestyle ? "lifestyle" : "default"} 
                            className="text-xs shrink-0 px-2 py-0.5 animate-pulse"
                          >
                            {t('documents.new')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Type */}
                    <div
                      className="px-4 py-3"
                      style={{ width: columns[1].width, minWidth: columns[1].minWidth }}
                      role="gridcell"
                    >
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs font-medium", getFileTypeColor(file.mime))}
                      >
                        {getFileTypeLabel(file.mime)}
                      </Badge>
                    </div>

                    {/* Size */}
                    <div
                      className="px-4 py-3"
                      style={{ width: columns[2].width, minWidth: columns[2].minWidth }}
                      role="gridcell"
                    >
                      <span className="text-sm text-muted-foreground font-mono">
                        {formatFileSize(file.size)}
                      </span>
                    </div>

                    {/* Tags */}
                    <div
                      className="px-4 py-3 overflow-hidden"
                      style={{ width: columns[3].width, minWidth: columns[3].minWidth }}
                      role="gridcell"
                    >
                      {file.tags && file.tags.length > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex gap-1.5 overflow-hidden">
                                {file.tags.slice(0, 2).map((tag) => (
                                  <Badge 
                                    key={tag} 
                                    variant={isLifestyle ? "lifestyle-secondary" : "secondary"}
                                    className="text-xs truncate max-w-[120px] px-2 py-0.5"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {file.tags.length > 2 && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs px-2 py-0.5 bg-muted/50"
                                  >
                                    +{file.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="flex flex-wrap gap-1.5">
                                {file.tags.map((tag) => (
                                  <Badge 
                                    key={tag} 
                                    variant={isLifestyle ? "lifestyle-secondary" : "secondary"}
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-sm text-muted-foreground/50">—</span>
                      )}
                    </div>

                    {/* Date */}
                    <div
                      className="px-4 py-3"
                      style={{ width: columns[4].width, minWidth: columns[4].minWidth }}
                      role="gridcell"
                    >
                      <span className="text-sm text-muted-foreground">
                        {new Date(file.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div
                      className="px-2 py-3 flex items-center justify-end"
                      style={{ width: columns[5].width, minWidth: columns[5].minWidth }}
                      role="gridcell"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-md hover:bg-accent"
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-lg bg-popover border-2 border-border shadow-2xl backdrop-blur-md">
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onPreview(file); }} 
                            className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                          >
                            <Eye className="h-4 w-4 text-primary" />
                            <span className="font-medium">{t('documents.preview')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onDownload(file); }} 
                            className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                          >
                            <Download className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{t('documents.download')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onRename(file); }} 
                            className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                          >
                            <Edit className="h-4 w-4 text-green-500" />
                            <span className="font-medium">{t('documents.rename')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onMove(file.id); }} 
                            className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                          >
                            <FolderInput className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">{t('documents.move')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onEditTags(file); }} 
                            className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                          >
                            <TagsIcon className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">{t('documents.editTags')}</span>
                          </DropdownMenuItem>
                          <div className="my-1 h-px bg-border" />
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                            className="gap-2 text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="font-medium">{t('documents.delete')}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-56 rounded-lg bg-popover border-2 border-border shadow-2xl backdrop-blur-md">
                  <ContextMenuItem 
                    onClick={() => onPreview(file)} 
                    className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                  >
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t('documents.preview')}</span>
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={() => onDownload(file)} 
                    className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                  >
                    <Download className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{t('documents.download')}</span>
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={() => onRename(file)} 
                    className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                  >
                    <Edit className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{t('documents.rename')}</span>
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={() => onMove(file.id)} 
                    className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                  >
                    <FolderInput className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{t('documents.move')}</span>
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={() => onEditTags(file)} 
                    className="gap-2 rounded-md transition-colors hover:bg-accent focus:bg-accent"
                  >
                    <TagsIcon className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{t('documents.editTags')}</span>
                  </ContextMenuItem>
                  <div className="my-1 h-px bg-border" />
                  <ContextMenuItem
                    onClick={() => onDelete(file.id)}
                    className="gap-2 text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium">{t('documents.delete')}</span>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </div>

      {/* Selection Info */}
      {selectedRows.size > 0 && (
        <div className="mt-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-primary">
            {t('documents.selectedCount', { count: selectedRows.size })}
          </span>
        </div>
      )}
    </div>
  );
};
