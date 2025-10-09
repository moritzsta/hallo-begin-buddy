import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { MoreVertical, Download, Trash2, Edit, FileIcon, Loader2, Search, Folder as FolderIcon, SlidersHorizontal, CheckCheck } from 'lucide-react';
import { MoveFileDialog } from './MoveFileDialog';
import { DocumentPreview } from './DocumentPreview';
import { FilterPanel, FileFilters } from './FilterPanel';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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

type SortField = 'created_at' | 'title' | 'size';
type SortOrder = 'asc' | 'desc';

interface DocumentListProps {
  folderId: string | null;
}

export const DocumentList = ({ folderId }: DocumentListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [moveFileId, setMoveFileId] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<FileFilters>({
    mimeTypes: [],
    dateFrom: '',
    dateTo: '',
    sizeMin: 0,
    sizeMax: Infinity,
    tags: [],
  });

  // Fetch profile to get last_seen_at
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('last_seen_at')
        .eq('id', user!.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch documents
  const { data: allFiles, isLoading } = useQuery({
    queryKey: ['files', user?.id, folderId, sortField, sortOrder, debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select('*')
        .eq('owner_id', user!.id);

      // Filter by folder
      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      // Apply search
      if (debouncedSearch) {
        query = query.or(`title.ilike.%${debouncedSearch}%,tags.cs.{${debouncedSearch}}`);
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      return data as FileRecord[];
    },
    enabled: !!user,
  });

  // Check for new files
  const newFilesCount = useMemo(() => {
    if (!allFiles || !profile?.last_seen_at) return 0;
    const lastSeenDate = new Date(profile.last_seen_at);
    return allFiles.filter((file) => new Date(file.created_at) > lastSeenDate).length;
  }, [allFiles, profile]);

  const isNewFile = (file: FileRecord): boolean => {
    if (!profile?.last_seen_at) return false;
    return new Date(file.created_at) > new Date(profile.last_seen_at);
  };

  // Apply client-side filters
  const files = useMemo(() => {
    if (!allFiles) return [];

    return allFiles.filter((file) => {
      // MIME type filter
      if (filters.mimeTypes.length > 0) {
        const matchesMime = filters.mimeTypes.some((mimeType) =>
          file.mime.startsWith(mimeType.replace('/', '')) || file.mime === mimeType
        );
        if (!matchesMime) return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const fileDate = new Date(file.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (fileDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const fileDate = new Date(file.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (fileDate > toDate) return false;
      }

      // Size range filter
      if (file.size < filters.sizeMin || file.size > filters.sizeMax) {
        return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        if (!file.tags || file.tags.length === 0) return false;
        const hasMatchingTag = filters.tags.some((tag) => file.tags?.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [allFiles, filters]);

  // Extract all unique tags from files
  const availableTags = useMemo(() => {
    if (!allFiles) return [];
    const tagSet = new Set<string>();
    allFiles.forEach((file) => {
      if (file.tags) {
        file.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [allFiles]);

  const handleClearFilters = () => {
    setFilters({
      mimeTypes: [],
      dateFrom: '',
      dateTo: '',
      sizeMin: 0,
      sizeMax: Infinity,
      tags: [],
    });
  };

  // Download file
  const downloadFile = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-signed-url', {
        body: {
          bucket: 'documents',
          path: file.storage_path,
          expiresIn: 300, // 5 minutes
        },
      });

      if (error) throw error;

      // Open download in new tab
      window.open(data.signedUrl, '_blank');

      toast({
        title: t('documents.downloadStarted'),
        description: t('documents.downloadStartedDesc', { filename: file.title }),
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: t('documents.downloadError'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const file = files?.find(f => f.id === fileId);
      if (!file) throw new Error('Datei nicht gefunden');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        title: t('documents.deleteSuccess'),
        description: t('documents.deleteSuccessDesc'),
      });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: t('documents.deleteError'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    },
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from('files')
        .update({ title })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        title: t('documents.renameSuccess'),
        description: t('documents.renameSuccessDesc'),
      });
      setEditingId(null);
      setEditTitle('');
    },
    onError: (error) => {
      toast({
        title: t('documents.renameError'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    },
  });

  // Mark all as seen mutation
  const markAsSeenMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: t('documents.markAsSeenSuccess'),
        description: t('documents.markAsSeenSuccessDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    },
  });

  const startEdit = (file: FileRecord) => {
    setEditingId(file.id);
    setEditTitle(file.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      renameMutation.mutate({ id: editingId, title: editTitle.trim() });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Files Badge and Mark as Seen */}
      {newFilesCount > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-sm">
                {t('documents.newFiles', { count: newFilesCount })}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {t('documents.newFilesDesc')}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAsSeenMutation.mutate()}
              disabled={markAsSeenMutation.isPending}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              {t('documents.markAsSeenButton')}
            </Button>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('documents.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">{t('documents.sortDate')}</SelectItem>
                <SelectItem value="title">{t('documents.sortName')}</SelectItem>
                <SelectItem value="size">{t('documents.sortSize')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t('filters.title')}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[350px] sm:w-[400px] overflow-y-auto">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableTags={availableTags}
                  onClearFilters={handleClearFilters}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      {!files || files.length === 0 ? (
        <Card className="p-12 text-center">
          <FileIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery || filters.mimeTypes.length > 0 || filters.tags.length > 0 || filters.dateFrom || filters.dateTo 
              ? t('documents.noResults') 
              : t('documents.noDocuments')}
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('documents.name')}</TableHead>
                <TableHead>{t('documents.type')}</TableHead>
                <TableHead>{t('documents.size')}</TableHead>
                <TableHead>{t('documents.tags')}</TableHead>
                <TableHead>{t('documents.date')}</TableHead>
                <TableHead className="text-right">{t('documents.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    {editingId === file.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="h-8"
                          autoFocus
                        />
                        <Button size="sm" onClick={saveEdit}>
                          {t('documents.save')}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <DocumentPreview 
                          fileId={file.id}
                          fileName={file.title}
                          mimeType={file.mime}
                          size="sm"
                        />
                        <span className="font-medium">{file.title}</span>
                        {isNewFile(file) && (
                          <Badge variant="default" className="text-xs">
                            {t('documents.new')}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{file.mime.split('/')[1]?.toUpperCase() || 'FILE'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatFileSize(file.size)}
                  </TableCell>
                  <TableCell>
                    {file.tags && file.tags.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {file.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(file.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => downloadFile(file)}>
                          <Download className="h-4 w-4 mr-2" />
                          {t('documents.download')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startEdit(file)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('documents.rename')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMoveFileId(file.id)}>
                          <FolderIcon className="h-4 w-4 mr-2" />
                          {t('documents.move')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(file.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('documents.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('documents.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('documents.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('documents.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MoveFileDialog
        open={!!moveFileId}
        onOpenChange={(open) => !open && setMoveFileId(null)}
        fileId={moveFileId}
        currentFolderId={folderId}
      />
    </div>
  );
};