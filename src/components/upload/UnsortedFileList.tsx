import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Trash2, MoreVertical, FolderInput, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnsortedFolder } from '@/hooks/useUnsortedFolder';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { MoveFileDialog } from '@/components/documents/MoveFileDialog';
import { TagInput } from '@/components/documents/TagInput';
import { fadeInUp, staggerContainer, getAnimationProps } from '@/lib/animations';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { DOCUMENT_TYPES, getDocumentTypeLabel } from '@/lib/documentTypes';

interface UnsortedFile {
  id: string;
  title: string;
  mime: string;
  size: number;
  storage_path: string;
  created_at: string;
  document_type: string | null;
  tags: string[] | null;
  meta: any;
}

interface FileMetadata {
  description: string;
  documentType: string;
  tags: string[];
  skipAiAnalysis: boolean;
}

interface UnsortedFileListProps {
  onSmartUpload: (fileId: string, skipDocumentAnalysis?: boolean) => void;
  smartUploadLoading: string | null;
}

export function UnsortedFileList({ onSmartUpload, smartUploadLoading }: UnsortedFileListProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { unsortedFolderId } = useUnsortedFolder();
  
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [moveFileId, setMoveFileId] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [fileMetadata, setFileMetadata] = useState<Record<string, FileMetadata>>({});

  // Fetch files in unsorted folder
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['unsorted-files', unsortedFolderId],
    queryFn: async () => {
      if (!unsortedFolderId) return [];
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', unsortedFolderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UnsortedFile[];
    },
    enabled: !!unsortedFolderId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const file = files.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');

      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unsorted-files'] });
      queryClient.invalidateQueries({ queryKey: ['unsorted-count'] });
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

  const toggleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const handleBatchSmartUpload = async () => {
    const filesToProcess = selectedFiles.size > 0 
      ? files.filter(f => selectedFiles.has(f.id))
      : files;

    if (filesToProcess.length === 0) return;

    setBatchProcessing(true);
    
    for (const file of filesToProcess) {
      await onSmartUpload(file.id);
      // Small delay between files to not overwhelm the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setBatchProcessing(false);
    setSelectedFiles(new Set());
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const toggleExpanded = (fileId: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const updateFileMetadata = (fileId: string, field: keyof FileMetadata, value: string) => {
    setFileMetadata(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [field]: value,
      },
    }));
  };

  // Get metadata for file (from state or from file's existing data)
  const getFileMetadata = (file: UnsortedFile): FileMetadata => {
    const existing = fileMetadata[file.id];
    return {
      description: existing?.description ?? (file.meta?.description || ''),
      documentType: existing?.documentType ?? (file.document_type || ''),
      tags: existing?.tags ?? (file.tags || []),
      skipAiAnalysis: existing?.skipAiAnalysis ?? false,
    };
  };

  const updateSkipAiAnalysis = (fileId: string, value: boolean) => {
    setFileMetadata(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        skipAiAnalysis: value,
      },
    }));
  };

  const updateFileTags = (fileId: string, tags: string[]) => {
    setFileMetadata(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        tags,
      },
    }));
  };

  // Update file mutation for saving metadata
  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, description, documentType, tags }: { fileId: string; description: string; documentType: string; tags: string[] }) => {
      const { error } = await supabase
        .from('files')
        .update({
          document_type: documentType || null,
          tags: tags.length > 0 ? tags : null,
          meta: { description: description || null },
        })
        .eq('id', fileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unsorted-files'] });
      toast({
        title: t('common.saved', { defaultValue: 'Gespeichert' }),
        description: t('upload.metadataSaved', { defaultValue: 'Metadaten wurden gespeichert' }),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FolderInput className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          {t('upload.noUnsortedFiles', { defaultValue: 'Keine unsortierten Dateien' })}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('upload.noUnsortedFilesDesc', { 
            defaultValue: 'Laden Sie Dateien über den Upload-Bereich hoch, um sie hier mit Smart Upload zu sortieren.' 
          })}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedFiles.size === files.length && files.length > 0}
            onCheckedChange={selectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedFiles.size > 0 
              ? t('documents.selectedCount', { count: selectedFiles.size })
              : `${files.length} ${t('upload.filesInUnsorted', { defaultValue: 'Dateien zum Sortieren' })}`
            }
          </span>
        </div>

        <Button
          onClick={handleBatchSmartUpload}
          disabled={batchProcessing || !!smartUploadLoading}
          className="gap-2"
        >
          {batchProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('upload.processing', { defaultValue: 'Verarbeite...' })}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {selectedFiles.size > 0 
                ? t('upload.smartUploadSelected', { 
                    defaultValue: 'Ausgewählte sortieren ({{count}})', 
                    count: selectedFiles.size 
                  })
                : t('upload.smartUploadAll', { defaultValue: 'Alle sortieren' })
              }
            </>
          )}
        </Button>
      </div>

      {/* File list */}
      <motion.div {...getAnimationProps(staggerContainer)} className="space-y-2">
        <AnimatePresence mode="popLayout">
          {files.map(file => {
            const metadata = getFileMetadata(file);
            const isExpanded = expandedFiles.has(file.id);
            
            return (
              <motion.div key={file.id} {...getAnimationProps(fadeInUp)} layout>
                <Card className={`transition-all duration-200 ${
                  selectedFiles.has(file.id) ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(file.id)}>
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedFiles.has(file.id)}
                          onCheckedChange={() => toggleSelectFile(file.id)}
                          className="mt-1"
                        />

                        {/* Preview */}
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          <DocumentPreview
                            fileId={file.id}
                            fileName={file.title}
                            mimeType={file.mime}
                            size="sm"
                          />
                        </div>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium truncate">{file.title}</h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {file.mime.split('/')[1]?.toUpperCase() || 'FILE'}
                                </Badge>
                                {metadata.documentType && (
                                  <Badge variant="outline" className="text-xs">
                                    {getDocumentTypeLabel(metadata.documentType, i18n.language)}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(file.created_at), 'dd.MM.yyyy HH:mm', {
                                    locale: i18n.language === 'de' ? de : undefined,
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                  {t('upload.details', { defaultValue: 'Details' })}
                                </Button>
                              </CollapsibleTrigger>
                              
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => onSmartUpload(file.id, metadata.skipAiAnalysis)}
                                disabled={smartUploadLoading === file.id || batchProcessing}
                                className="gap-1"
                              >
                                {smartUploadLoading === file.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3 w-3" />
                                )}
                                {t('upload.smartUpload')}
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover">
                                  <DropdownMenuItem onClick={() => setMoveFileId(file.id)}>
                                    <FolderInput className="mr-2 h-4 w-4" />
                                    {t('documents.move')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setDeleteId(file.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('documents.delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable metadata section */}
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t border-border/50 bg-muted/30">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Document Type */}
                          <div className="space-y-2">
                            <Label htmlFor={`doctype-${file.id}`}>
                              {t('upload.documentType', { defaultValue: 'Dokumententyp' })}
                            </Label>
                            <Select
                              value={metadata.documentType}
                              onValueChange={(value) => updateFileMetadata(file.id, 'documentType', value)}
                            >
                              <SelectTrigger id={`doctype-${file.id}`} className="bg-background">
                                <SelectValue placeholder={t('upload.selectDocumentType', { defaultValue: 'Typ auswählen...' })} />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                {Object.keys(DOCUMENT_TYPES).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {getDocumentTypeLabel(type, i18n.language)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Description */}
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor={`desc-${file.id}`}>
                              {t('upload.description', { defaultValue: 'Beschreibung' })}
                            </Label>
                            <Textarea
                              id={`desc-${file.id}`}
                              value={metadata.description}
                              onChange={(e) => updateFileMetadata(file.id, 'description', e.target.value)}
                              placeholder={t('upload.descriptionPlaceholder', { 
                                defaultValue: 'Optionale Beschreibung oder Notizen...' 
                              })}
                              rows={2}
                              className="resize-none bg-background"
                            />
                          </div>

                          {/* Tags */}
                          <div className="space-y-2 sm:col-span-2">
                            <Label>
                              {t('documents.tags', { defaultValue: 'Tags' })}
                            </Label>
                            <TagInput
                              tags={metadata.tags}
                              onTagsChange={(tags) => updateFileTags(file.id, tags)}
                              placeholder={t('tags.inputPlaceholder', { defaultValue: 'Tag hinzufügen...' })}
                              maxTags={10}
                            />
                          </div>

                          {/* Skip AI Analysis Checkbox */}
                          <div className="flex items-center space-x-2 sm:col-span-2">
                            <Checkbox
                              id={`skip-ai-${file.id}`}
                              checked={metadata.skipAiAnalysis}
                              onCheckedChange={(checked) => updateSkipAiAnalysis(file.id, !!checked)}
                            />
                            <Label htmlFor={`skip-ai-${file.id}`} className="text-sm font-normal cursor-pointer">
                              {t('upload.skipAiAnalysis', { 
                                defaultValue: 'Ohne Dokumentenanalyse (nutzt nur Metadaten und Titel)' 
                              })}
                            </Label>
                          </div>
                        </div>

                        {/* Save button */}
                        <div className="flex justify-end mt-4">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              updateFileMutation.mutate({
                                fileId: file.id,
                                description: metadata.description,
                                documentType: metadata.documentType,
                                tags: metadata.tags,
                              });
                            }}
                            disabled={updateFileMutation.isPending}
                          >
                            {updateFileMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            ) : null}
                            {t('common.save', { defaultValue: 'Speichern' })}
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('documents.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move file dialog */}
      <MoveFileDialog
        open={!!moveFileId}
        onOpenChange={(open) => !open && setMoveFileId(null)}
        fileId={moveFileId || ''}
        currentFolderId={unsortedFolderId || ''}
      />
    </div>
  );
}
