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
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Trash2, Edit, FolderInput, Tags as TagsIcon, Eye } from 'lucide-react';
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
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'name', label: t('documents.name'), width: 300, minWidth: 150, resizable: true },
    { key: 'type', label: t('documents.type'), width: 180, minWidth: 120, resizable: true },
    { key: 'size', label: t('documents.size'), width: 100, minWidth: 80, resizable: true },
    { key: 'tags', label: t('documents.tags'), width: 250, minWidth: 150, resizable: true },
    { key: 'date', label: t('documents.date'), width: 180, minWidth: 120, resizable: true },
    { key: 'actions', label: t('documents.actions'), width: 80, minWidth: 80, resizable: false },
  ]);

  const [resizing, setResizing] = useState<{ columnKey: string; startX: number; startWidth: number } | null>(null);

  // Virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
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

  const totalWidth = useMemo(() => columns.reduce((sum, col) => sum + col.width, 0), [columns]);

  return (
    <div className="relative">
      <div
        ref={parentRef}
        className="overflow-auto border rounded-lg bg-card"
        style={{ height: '600px' }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="grid"
        aria-label={t('documents.documentList')}
      >
        {/* Sticky Header */}
        <div
          className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b flex"
          style={{ minWidth: totalWidth }}
        >
          {columns.map((column, idx) => (
            <div
              key={column.key}
              className="relative flex items-center px-3 py-2 text-xs font-medium text-muted-foreground border-r last:border-r-0"
              style={{ width: column.width, minWidth: column.minWidth }}
              role="columnheader"
            >
              <span className="truncate">{column.label}</span>
              {column.resizable && (
                <div
                  className={cn(
                    "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary",
                    resizing?.columnKey === column.key && "bg-primary"
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
                      "absolute top-0 left-0 w-full flex items-center border-b transition-colors cursor-pointer",
                      isSelected && "bg-primary/10",
                      isFocused && "ring-2 ring-primary ring-inset",
                      !isSelected && "hover:bg-muted/50"
                    )}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      minWidth: totalWidth,
                    }}
                    onClick={(e) => handleRowClick(virtualRow.index, e)}
                    role="row"
                    aria-selected={isSelected}
                    aria-rowindex={virtualRow.index + 1}
                  >
                    {/* Name */}
                    <div
                      className="px-3 py-2 flex items-center gap-2 border-r"
                      style={{ width: columns[0].width, minWidth: columns[0].minWidth }}
                      role="gridcell"
                    >
                      <span className={cn("truncate text-sm", isNew && "font-semibold")}>
                        {file.title}
                      </span>
                      {isNew && (
                        <Badge variant={isLifestyle ? "lifestyle" : "default"} className="text-xs">
                          {t('documents.new')}
                        </Badge>
                      )}
                    </div>

                    {/* Type */}
                    <div
                      className="px-3 py-2 border-r"
                      style={{ width: columns[1].width, minWidth: columns[1].minWidth }}
                      role="gridcell"
                    >
                      <span className="text-sm text-muted-foreground truncate">
                        {getFileTypeLabel(file.mime)}
                      </span>
                    </div>

                    {/* Size */}
                    <div
                      className="px-3 py-2 border-r"
                      style={{ width: columns[2].width, minWidth: columns[2].minWidth }}
                      role="gridcell"
                    >
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>

                    {/* Tags */}
                    <div
                      className="px-3 py-2 border-r overflow-hidden"
                      style={{ width: columns[3].width, minWidth: columns[3].minWidth }}
                      role="gridcell"
                    >
                      {file.tags && file.tags.length > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex gap-1 overflow-hidden">
                                {file.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs truncate">
                                    {tag}
                                  </Badge>
                                ))}
                                {file.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{file.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {file.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Date */}
                    <div
                      className="px-3 py-2 border-r"
                      style={{ width: columns[4].width, minWidth: columns[4].minWidth }}
                      role="gridcell"
                    >
                      <span className="text-sm text-muted-foreground">
                        {new Date(file.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions - Empty, context menu handles this */}
                    <div
                      className="px-3 py-2"
                      style={{ width: columns[5].width, minWidth: columns[5].minWidth }}
                      role="gridcell"
                    >
                      <span className="text-sm text-muted-foreground">⋮</span>
                    </div>
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-48">
                  <ContextMenuItem onClick={() => onPreview(file)} className="gap-2">
                    <Eye className="h-4 w-4" />
                    {t('documents.preview')}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onDownload(file)} className="gap-2">
                    <Download className="h-4 w-4" />
                    {t('documents.download')}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onRename(file)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    {t('documents.rename')}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onMove(file.id)} className="gap-2">
                    <FolderInput className="h-4 w-4" />
                    {t('documents.move')}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onEditTags(file)} className="gap-2">
                    <TagsIcon className="h-4 w-4" />
                    {t('documents.editTags')}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => onDelete(file.id)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('documents.delete')}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </div>

      {/* Selection Info */}
      {selectedRows.size > 0 && (
        <div className="mt-2 text-sm text-muted-foreground">
          {t('documents.selectedCount', { count: selectedRows.size })}
        </div>
      )}
    </div>
  );
};
