import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download,
  Trash2,
  FolderIcon,
  Tags as TagsIcon,
  Link,
  X,
  Save,
  Edit,
  Calendar,
  HardDrive,
  ChevronRight,
} from 'lucide-react';
import { DocumentPreview } from './DocumentPreview';
import { TagInput } from './TagInput';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface FileDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    id: string;
    title: string;
    mime: string;
    size: number;
    storage_path: string;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
    folder_id: string;
    meta: any;
  } | null;
  availableTags: string[];
  onDelete: (fileId: string) => void;
  onMove: (fileId: string) => void;
  onShare: () => void;
  onDownload: () => void;
}

export const FileDetailsModal = ({
  open,
  onOpenChange,
  file,
  availableTags,
  onDelete,
  onMove,
  onShare,
  onDownload,
}: FileDetailsModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);

  // Fetch folders to build breadcrumb path
  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!file,
  });

  // Build folder path breadcrumb
  const folderPath = useMemo(() => {
    if (!file || !file.folder_id || !folders.length) return null;
    
    const path: Array<{ id: string; name: string }> = [];
    let currentFolderId = file.folder_id;
    
    while (currentFolderId) {
      const folder = folders.find(f => f.id === currentFolderId);
      if (!folder) break;
      path.unshift({ id: folder.id, name: folder.name });
      currentFolderId = folder.parent_id;
    }
    
    return path;
  }, [file, folders]);

  // Initialize editing state when file changes
  const handleStartEdit = () => {
    if (file) {
      setEditTitle(file.title);
      setEditTags(file.tags || []);
      setIsEditing(true);
    }
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const { error } = await supabase
        .from('files')
        .update({
          title: editTitle,
          tags: editTags,
        })
        .eq('id', file.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        title: t('documents.renameSuccess'),
        description: t('documents.renameSuccessDesc'),
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    },
  });

  // Mark as seen when opening
  const markAsSeenMutation = useMutation({
    mutationFn: async () => {
      if (!file || !user) return;
      const { error } = await supabase
        .from('profiles')
        .update({ last_seen_at: file.created_at })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Mark as seen on open
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      markAsSeenMutation.mutate();
    }
    onOpenChange(newOpen);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-lg font-semibold"
                    autoFocus
                  />
                ) : (
                  <DialogTitle className="text-lg font-semibold truncate">
                    {file.title}
                  </DialogTitle>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{file.mime.split('/')[1]?.toUpperCase()}</Badge>
                  <span>•</span>
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{format(new Date(file.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {t('common.save')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartEdit}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {t('common.edit')}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
              {/* Left: Preview */}
              <div className="flex flex-col min-h-[400px]">
                <Label className="mb-2">{t('documents.preview')}</Label>
                <div className="flex-1 border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center">
                  <DocumentPreview
                    fileId={file.id}
                    fileName={file.title}
                    mimeType={file.mime}
                    size="lg"
                    clickable={false}
                  />
                </div>
              </div>

              {/* Right: Details & Actions */}
              <ScrollArea className="h-full">
                <div className="space-y-6 pr-4">
                  {/* File Information */}
                  <div>
                    <Label className="mb-3 block">{t('documents.fileInfo')}</Label>
                    <div className="space-y-3 text-sm">
                      {/* Folder Path */}
                      {folderPath && folderPath.length > 0 && (
                        <div className="flex items-start gap-2">
                          <FolderIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-muted-foreground">{t('documents.folder')}:</span>
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              {folderPath.map((folder, idx) => (
                                <div key={folder.id} className="flex items-center gap-1">
                                  <span className="font-medium truncate">{folder.name}</span>
                                  {idx < folderPath.length - 1 && (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* File Size */}
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">{t('documents.size')}:</span>
                          <span className="font-medium ml-2">{formatFileSize(file.size)}</span>
                        </div>
                      </div>

                      {/* Upload Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">{t('documents.uploadDate')}:</span>
                          <span className="font-medium ml-2">
                            {format(new Date(file.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </span>
                        </div>
                      </div>

                      {/* Last Modified */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">{t('documents.lastModified')}:</span>
                          <span className="font-medium ml-2">
                            {format(new Date(file.updated_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Tags */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <TagsIcon className="h-4 w-4" />
                      {t('documents.tags')}
                    </Label>
                    {isEditing ? (
                      <TagInput
                        tags={editTags}
                        onTagsChange={setEditTags}
                        suggestions={availableTags}
                        placeholder={t('tags.addTags')}
                        maxTags={10}
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {file.tags && file.tags.length > 0 ? (
                          file.tags.map((tag, i) => (
                            <Badge key={i} variant="outline">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {t('tags.addTags')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Metadata */}
                  {file.meta && Object.keys(file.meta).length > 0 && (
                    <>
                      <div>
                        <Label className="mb-2">{t('upload.extractedMetadata')}</Label>
                        <div className="space-y-2 text-sm">
                          {file.meta.doc_type && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('documents.docType')}:</span>
                              <span className="font-medium">{file.meta.doc_type}</span>
                            </div>
                          )}
                          {file.meta.party && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('documents.party')}:</span>
                              <span className="font-medium">{file.meta.party}</span>
                            </div>
                          )}
                          {file.meta.amount && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('documents.amount')}:</span>
                              <span className="font-medium">{file.meta.amount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <Label>{t('documents.actions')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="gap-2 justify-start"
                        onClick={onDownload}
                      >
                        <Download className="h-4 w-4" />
                        {t('documents.download')}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 justify-start"
                        onClick={onShare}
                      >
                        <Link className="h-4 w-4" />
                        {t('documents.shareLink')}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 justify-start"
                        onClick={() => onMove(file.id)}
                      >
                        <FolderIcon className="h-4 w-4" />
                        {t('documents.move')}
                      </Button>
                      <Button
                        variant="destructive"
                        className="gap-2 justify-start"
                        onClick={() => {
                          onDelete(file.id);
                          onOpenChange(false);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('documents.delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
