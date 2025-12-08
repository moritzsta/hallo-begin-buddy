import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { Upload, Loader2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const PLAN_LIMITS = {
  free: { maxSize: 5 * 1024 * 1024 },
  basic: { maxSize: 25 * 1024 * 1024 },
  plus: { maxSize: 100 * 1024 * 1024 },
  max: { maxSize: 2 * 1024 * 1024 * 1024 },
};

interface QuickUploadProps {
  folderId: string | null;
  onUploadComplete?: () => void;
}

export function QuickUpload({ folderId, onUploadComplete }: QuickUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  const planTier = (profile?.plan_tier || 'free') as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[planTier];

  const uploadFile = async (file: File, id: string) => {
    try {
      setUploadingFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, status: 'uploading' as const, progress: 10 } : f))
      );

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${user!.id}/${timestamp}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadingFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, progress: 50 } : f))
      );

      // Calculate hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Get target folder
      let targetFolderId = folderId;
      if (!targetFolderId) {
        const { data: rootFolder } = await supabase
          .from('folders')
          .select('id')
          .eq('owner_id', user!.id)
          .is('parent_id', null)
          .not('meta->>type', 'eq', 'unsorted')
          .limit(1)
          .maybeSingle();

        if (rootFolder) {
          targetFolderId = rootFolder.id;
        } else {
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

      setUploadingFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, progress: 75 } : f))
      );

      // Create file record
      const { data: fileData, error: dbError } = await supabase
        .from('files')
        .insert({
          owner_id: user!.id,
          title: file.name,
          storage_path: storagePath,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          hash_sha256: hashHex,
          folder_id: targetFolderId,
          tags: [],
          meta: {
            original_name: file.name,
            uploaded_at: new Date().toISOString(),
            quick_upload: true,
          },
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      // Increment unread count
      if (targetFolderId) {
        await supabase.rpc('increment_folder_unread_count', {
          p_user_id: user!.id,
          p_folder_id: targetFolderId,
          p_increment: 1,
        });
      }

      // Trigger preview generation for images/PDFs
      if (fileData && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        supabase.functions.invoke('generate-preview', {
          body: { file_id: fileData.id },
        });
      }

      setUploadingFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, status: 'success' as const, progress: 100 } : f))
      );

    } catch (error) {
      console.error('Quick upload error:', error);
      setUploadingFiles(prev =>
        prev.map(f => (f.id === id ? { 
          ...f, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : f))
      );
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > limits.maxSize) {
        toast({
          title: t('upload.uploadError'),
          description: t('upload.fileTooLarge', { 
            size: Math.round(limits.maxSize / 1024 / 1024), 
            tier: planTier 
          }),
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsOpen(true);

    const newFiles: UploadingFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);

    // Upload all files
    await Promise.all(newFiles.map(f => uploadFile(f.file, f.id)));

    // Show success toast
    const successCount = newFiles.length;
    if (successCount > 0) {
      toast({
        title: t('upload.uploadSuccess'),
        description: t('upload.uploadSuccessDesc', { 
          filename: successCount === 1 ? validFiles[0].name : `${successCount} ${t('common.files')}` 
        }),
      });
    }

    if (onUploadComplete) {
      onUploadComplete();
    }
  }, [user, profile, limits, onUploadComplete, t, toast, planTier, folderId]);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const handleClose = () => {
    // Only close if all uploads are complete
    const allComplete = uploadingFiles.every(f => f.status !== 'uploading');
    if (allComplete) {
      setIsOpen(false);
      setUploadingFiles([]);
    }
  };

  const allComplete = uploadingFiles.every(f => f.status !== 'uploading');
  const hasErrors = uploadingFiles.some(f => f.status === 'error');

  return (
    <>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <Button
          variant="outline"
          size="sm"
          onClick={open}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {t('upload.quickUpload', { defaultValue: 'Schnell-Upload' })}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('upload.quickUpload', { defaultValue: 'Schnell-Upload' })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {uploadingFiles.map(file => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-1 mt-2" />
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {file.status === 'uploading' && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {file.status === 'success' && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <X className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {allComplete && (
            <div className="flex justify-end pt-2">
              <Button onClick={handleClose} variant={hasErrors ? 'outline' : 'default'}>
                {t('common.close')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
