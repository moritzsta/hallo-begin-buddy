import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileIcon, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TagInput } from '@/components/documents/TagInput';
import { useQuery } from '@tanstack/react-query';
import { MetadataConfirmDialog } from './MetadataConfirmDialog';
import { fadeInUp, staggerContainer, getAnimationProps } from '@/lib/animations';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'awaiting-confirmation';
  error?: string;
  tags?: string[];
  fileId?: string; // Database file ID for smart upload
  smartMetadata?: any; // AI-extracted metadata
  userContext?: string; // Optional user-provided context for AI
  skipAiAnalysis?: boolean; // Skip AI analysis, use only metadata and title
  initialFolderId?: string; // Track original folder for decrement on move
}

const PLAN_LIMITS = {
  free: { maxSize: 5 * 1024 * 1024, maxFiles: 10 }, // 5MB
  basic: { maxSize: 25 * 1024 * 1024, maxFiles: 50 }, // 25MB
  plus: { maxSize: 100 * 1024 * 1024, maxFiles: 200 }, // 100MB
  max: { maxSize: 2 * 1024 * 1024 * 1024, maxFiles: 1000 }, // 2GB
};

interface FileUploadProps {
  folderId: string | null;
  onUploadComplete?: () => void;
}

export const FileUpload = ({ folderId, onUploadComplete }: FileUploadProps) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [confirmDialogState, setConfirmDialogState] = useState<{
    open: boolean;
    uploadFileId: string | null;
  }>({ open: false, uploadFileId: null });
  const [smartUploadLoading, setSmartUploadLoading] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  const planTier = (profile?.plan_tier || 'free') as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[planTier];

  // Fetch all available tags for suggestions
  const { data: allFiles } = useQuery({
    queryKey: ['files', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select('tags')
        .eq('owner_id', user!.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const availableTags = Array.from(
    new Set(
      allFiles?.flatMap(file => file.tags || []) || []
    )
  ).sort();

  const validateFile = (file: File): string | null => {
    if (file.size > limits.maxSize) {
      return t('upload.fileTooLarge', { 
        size: Math.round(limits.maxSize / 1024 / 1024), 
        tier: planTier 
      });
    }
    return null;
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    const { file, id } = uploadFile;
    
    try {
      setUploadFiles(prev => 
        prev.map(f => f.id === id ? { ...f, status: 'uploading' as const, progress: 0 } : f)
      );

      // Generate unique storage path
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${user!.id}/${timestamp}_${safeName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadFiles(prev => 
        prev.map(f => f.id === id ? { ...f, progress: 50 } : f)
      );

      // Calculate SHA256 hash (simplified - in production use crypto)
      const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Get root folder if no folder selected
      let targetFolderId = folderId;
      if (!targetFolderId) {
        // Get or create root folder
        const { data: rootFolder } = await supabase
          .from('folders')
          .select('id')
          .eq('owner_id', user!.id)
          .is('parent_id', null)
          .limit(1)
          .single();

        if (rootFolder) {
          targetFolderId = rootFolder.id;
        } else {
          // Create root folder
          const { data: newRoot, error: folderError } = await supabase
            .from('folders')
            .insert({
              owner_id: user!.id,
              name: 'Root',
              parent_id: null,
            })
            .select('id')
            .single();

          if (folderError) throw folderError;
          targetFolderId = newRoot.id;
        }
      }

      // Create file record in database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          owner_id: user!.id,
          title: file.name,
          storage_path: storagePath,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          hash_sha256: hashHex,
          folder_id: targetFolderId,
          tags: uploadFile.tags || [],
          meta: {
            original_name: file.name,
            uploaded_at: new Date().toISOString(),
          },
        });

      if (dbError) throw dbError;

      // Increment unread count for the target folder and all parent folders
      // This will be adjusted later if the file is moved via Smart Upload
      if (targetFolderId) {
        const { error: incrementError } = await supabase.rpc('increment_folder_unread_count', {
          p_user_id: user!.id,
          p_folder_id: targetFolderId,
          p_increment: 1,
        });

        if (incrementError) {
          console.error('Failed to increment unread count:', incrementError);
          // Don't fail the upload, just log the error
        }
      }

      setUploadFiles(prev => 
        prev.map(f => f.id === id ? { ...f, status: 'success' as const, progress: 100, initialFolderId: targetFolderId || undefined } : f)
      );

      // Get file ID for smart upload processing
      const { data: fileData } = await supabase
        .from('files')
        .select('id')
        .eq('storage_path', storagePath)
        .single();

      if (fileData) {
        // Store file_id in upload state for later smart upload
        setUploadFiles(prev => 
          prev.map(f => f.id === id ? { ...f, fileId: fileData.id } : f)
        );

        // Trigger preview generation (fire and forget) for images and PDFs
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          supabase.functions.invoke('generate-preview', {
            body: { file_id: fileData.id },
          }).then(({ error: previewError }) => {
            if (previewError) {
              console.warn('Preview generation failed:', previewError);
            }
          });
        }
      }

      toast({
        title: t('upload.uploadSuccess'),
        description: t('upload.uploadSuccessDesc', { filename: file.name }),
      });

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      
      setUploadFiles(prev => 
        prev.map(f => f.id === id ? { ...f, status: 'error' as const, error: errorMessage } : f)
      );

      toast({
        title: t('upload.uploadError'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => {
      const validationError = validateFile(file);
      return {
        file,
        id: `${Date.now()}-${Math.random()}`,
        progress: 0,
        status: validationError ? ('error' as const) : ('pending' as const),
        error: validationError || undefined,
      };
    });

    setUploadFiles(prev => [...prev, ...newFiles]);

    // Start uploads for valid files
    newFiles
      .filter(f => f.status === 'pending')
      .forEach(f => uploadFile(f));
  }, [user, profile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: limits.maxFiles,
  });

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileTags = (id: string, tags: string[]) => {
    setUploadFiles(prev =>
      prev.map(f => f.id === id ? { ...f, tags } : f)
    );
  };

  const updateFileContext = (id: string, userContext: string) => {
    setUploadFiles(prev =>
      prev.map(f => f.id === id ? { ...f, userContext } : f)
    );
  };

  const updateSkipAiAnalysis = (id: string, skipAiAnalysis: boolean) => {
    setUploadFiles(prev =>
      prev.map(f => f.id === id ? { ...f, skipAiAnalysis } : f)
    );
  };

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status === 'uploading'));
    if (onUploadComplete) onUploadComplete();
  };

  const triggerSmartUpload = async (uploadFileId: string) => {
    const uploadFile = uploadFiles.find(f => f.id === uploadFileId);
    if (!uploadFile?.fileId) return;

    setSmartUploadLoading(uploadFileId);

    try {
      // Call smart-upload edge function
      // skipDocumentAnalysis means: don't analyze the document content, 
      // but still use AI to generate optimal folder structure from metadata and title
      const { data, error } = await supabase.functions.invoke('smart-upload', {
        body: { 
          file_id: uploadFile.fileId,
          user_context: uploadFile.userContext || undefined,
          skip_document_analysis: uploadFile.skipAiAnalysis || false
        },
      });

      if (error) throw error;

      if (data?.extracted) {
        // Transform AI response to expected metadata format
        const transformedMetadata = {
          title: data.extracted.suggested_title || uploadFile.file.name,
          doc_type: data.extracted.document_type || undefined,
          keywords: data.extracted.keywords || [],
          suggested_path: data.extracted.suggested_path || undefined,
        };
        
        // Update upload file with metadata and show confirmation dialog
        setUploadFiles(prev =>
          prev.map(f =>
            f.id === uploadFileId
              ? { ...f, status: 'awaiting-confirmation' as const, smartMetadata: transformedMetadata }
              : f
          )
        );
        setConfirmDialogState({ open: true, uploadFileId });
      } else if (data?.message) {
        // Feature not supported or skipped
        toast({
          title: t('upload.smartUploadSkipped', { defaultValue: 'Smart Upload nicht verfügbar' }),
          description: data.message,
        });
      } else {
        // No metadata extracted
        toast({
          title: t('upload.smartUploadSkipped', { defaultValue: 'Smart Upload übersprungen' }),
          description: t('upload.smartUploadSkippedDesc', { 
            defaultValue: 'Keine Metadaten extrahiert. Datei wurde normal abgelegt.' 
          }),
        });
      }
    } catch (error) {
      console.error('Smart upload error:', error);
      toast({
        title: t('upload.smartUploadError', { defaultValue: 'Smart Upload fehlgeschlagen' }),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setSmartUploadLoading(null);
    }
  };

  const handleConfirmMetadata = async (updatedMetadata: any, tags: string[]) => {
    const uploadFileId = confirmDialogState.uploadFileId;
    if (!uploadFileId) return;

    const uploadFile = uploadFiles.find(f => f.id === uploadFileId);
    if (!uploadFile?.fileId) return;

    try {
      let targetFolderId = folderId; // Default to current folder

      // If there's a suggested_path from AI, create folder structure
      if (uploadFile.smartMetadata?.suggested_path) {
        const pathParts = uploadFile.smartMetadata.suggested_path.split('/').filter(Boolean);
        
        if (pathParts.length > 0) {
          // Fetch all folders to check which ones exist
          const { data: allFolders } = await supabase
            .from('folders')
            .select('*')
            .eq('owner_id', user!.id);

          let currentParentId: string | null = null;
          
          // Create folder hierarchy
          for (const folderName of pathParts) {
            // Check if folder exists at this level
            const existingFolder = allFolders?.find(
              f => f.name === folderName && f.parent_id === currentParentId
            );

            if (existingFolder) {
              currentParentId = existingFolder.id;
            } else {
              // Create new folder
              const { data: newFolder, error: folderError } = await supabase
                .from('folders')
                .insert({
                  owner_id: user!.id,
                  name: folderName,
                  parent_id: currentParentId,
                })
                .select()
                .single();

              if (folderError) {
                console.error('Failed to create folder:', folderError);
                throw new Error(`Fehler beim Erstellen des Ordners "${folderName}"`);
              }

              currentParentId = newFolder.id;
            }
          }

          // Use the last folder as target
          targetFolderId = currentParentId;
        }
      }

      // Update file with confirmed metadata, tags, and folder location
      const { error: updateError } = await supabase
        .from('files')
        .update({
          title: updatedMetadata.title,
          tags,
          folder_id: targetFolderId,
          meta: {
            ...(uploadFile.file ? { original_name: uploadFile.file.name } : {}),
            doc_type: updatedMetadata.doc_type,
            date: updatedMetadata.date,
            party: updatedMetadata.party,
            amount: updatedMetadata.amount,
            smart_upload: true,
            ai_suggested_path: uploadFile.smartMetadata?.suggested_path,
          },
        })
        .eq('id', uploadFile.fileId);

      if (updateError) throw updateError;

      // Handle unread count changes if folder was moved
      const oldFolderId = uploadFile.initialFolderId;
      const folderChanged = oldFolderId && targetFolderId && oldFolderId !== targetFolderId;

      if (folderChanged) {
        // Decrement old folder (file was moved away)
        const { error: decrementError } = await supabase.rpc('increment_folder_unread_count', {
          p_user_id: user!.id,
          p_folder_id: oldFolderId,
          p_increment: -1,
        });

        if (decrementError) {
          console.error('Failed to decrement old folder unread count:', decrementError);
        }

        // Increment new folder (file was moved here)
        if (targetFolderId) {
          const { error: incrementError } = await supabase.rpc('increment_folder_unread_count', {
            p_user_id: user!.id,
            p_folder_id: targetFolderId,
            p_increment: 1,
          });

          if (incrementError) {
            console.error('Failed to increment new folder unread count:', incrementError);
          }
        }
      }
      // If folder didn't change, the count was already incremented during upload

      setUploadFiles(prev =>
        prev.map(f => (f.id === uploadFileId ? { ...f, status: 'success' as const, tags } : f))
      );

      toast({
        title: t('upload.metadataConfirmed', { defaultValue: 'Metadaten bestätigt' }),
        description: t('upload.metadataConfirmedDesc', { 
          defaultValue: 'Datei wurde mit aktualisierten Metadaten abgelegt.' 
        }),
      });

      setConfirmDialogState({ open: false, uploadFileId: null });
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      console.error('Metadata update error:', error);
      toast({
        title: t('upload.metadataUpdateError', { defaultValue: 'Fehler beim Aktualisieren' }),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    }
  };

  const handleCancelConfirmation = () => {
    const uploadFileId = confirmDialogState.uploadFileId;
    if (uploadFileId) {
      // Mark as success without smart metadata
      setUploadFiles(prev =>
        prev.map(f => (f.id === uploadFileId ? { ...f, status: 'success' as const } : f))
      );
    }
    setConfirmDialogState({ open: false, uploadFileId: null });
  };

  const currentConfirmUploadFile = uploadFiles.find(
    f => f.id === confirmDialogState.uploadFileId
  );

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">
          {isDragActive ? t('upload.dragDropActive') : t('upload.dragDrop')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('upload.clickOrDrag')} ({t('upload.maxSize', { size: Math.round(limits.maxSize / 1024 / 1024) })})
        </p>
      </Card>

      <AnimatePresence mode="popLayout">
        {uploadFiles.length > 0 && (
          <motion.div
            {...getAnimationProps(staggerContainer)}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{t('upload.uploads')} ({uploadFiles.length})</h3>
              {uploadFiles.some(f => f.status === 'success') && (
                <Button onClick={clearCompleted} variant="ghost" size="sm">
                  {t('upload.clearCompleted')}
                </Button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {uploadFiles.map(uploadFile => (
                <motion.div
                  key={uploadFile.id}
                  {...getAnimationProps(fadeInUp)}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                  layout
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <FileIcon className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                   {uploadFile.status === 'uploading' && (
                    <div className="space-y-1">
                      <Progress value={uploadFile.progress} className="h-1" />
                      <p className="text-xs text-muted-foreground">
                        {t('upload.uploading')} {uploadFile.progress}%
                      </p>
                    </div>
                  )}

                  {uploadFile.status === 'success' && (
                    <p className="text-xs text-green-600">✓ {t('upload.success')}</p>
                  )}

                  {uploadFile.status === 'error' && (
                    <p className="text-xs text-destructive">✗ {uploadFile.error}</p>
                  )}

                  {uploadFile.status === 'pending' && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('upload.waiting')}
                    </div>
                  )}

                  {/* Tag Input for pending/success files */}
                  {(uploadFile.status === 'pending' || uploadFile.status === 'success') && (
                    <div className="mt-3 pt-3 border-t">
                      <TagInput
                        tags={uploadFile.tags || []}
                        onTagsChange={(tags) => updateFileTags(uploadFile.id, tags)}
                        suggestions={availableTags}
                        placeholder={t('tags.addTags')}
                        maxTags={10}
                      />
                    </div>
                  )}

                  {/* Smart Upload Section for successfully uploaded files */}
                  {uploadFile.status === 'success' && 
                   uploadFile.fileId && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {/* User Context Input */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {t('upload.userContext', { defaultValue: 'Optionale Hinweise für KI' })}
                        </label>
                        <input
                          type="text"
                          placeholder={t('upload.userContextPlaceholder', { 
                            defaultValue: 'z.B. Katze, Operation, Pfote' 
                          })}
                          value={uploadFile.userContext || ''}
                          onChange={(e) => updateFileContext(uploadFile.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('upload.userContextHelp', { 
                            defaultValue: 'Diese Informationen helfen der KI bei der Benennung und Einordnung' 
                          })}
                        </p>
                      </div>

                      {/* Skip AI Analysis Checkbox */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`skip-ai-${uploadFile.id}`}
                          checked={uploadFile.skipAiAnalysis || false}
                          onCheckedChange={(checked) => updateSkipAiAnalysis(uploadFile.id, checked as boolean)}
                        />
                        <label 
                          htmlFor={`skip-ai-${uploadFile.id}`}
                          className="text-xs text-muted-foreground cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t('upload.skipAiAnalysis', { 
                            defaultValue: 'Ohne KI-Analyse (nur Metadaten und Titel verwenden)' 
                          })}
                        </label>
                      </div>

                      {/* Smart Upload Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerSmartUpload(uploadFile.id)}
                        disabled={smartUploadLoading === uploadFile.id}
                        className="w-full"
                      >
                        {smartUploadLoading === uploadFile.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('upload.smartUploadProcessing', { defaultValue: 'Analysiere Dokument...' })}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {t('upload.smartUpload', { defaultValue: 'Smart Upload' })}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Awaiting Confirmation State */}
                  {uploadFile.status === 'awaiting-confirmation' && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-primary flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        {t('upload.awaitingConfirmation', { 
                          defaultValue: 'Warte auf Bestätigung der Metadaten...' 
                        })}
                      </p>
                    </div>
                  )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    )}
  </AnimatePresence>

      {/* Metadata Confirmation Dialog */}
      {currentConfirmUploadFile && (
        <MetadataConfirmDialog
          open={confirmDialogState.open}
          onOpenChange={(open) => setConfirmDialogState({ open, uploadFileId: null })}
          metadata={currentConfirmUploadFile.smartMetadata || {}}
          fileName={currentConfirmUploadFile.file.name}
          onConfirm={handleConfirmMetadata}
          onCancel={handleCancelConfirmation}
          availableTags={availableTags}
        />
      )}
    </div>
  );
};
