import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const PLAN_LIMITS = {
  free: { maxSize: 5 * 1024 * 1024, maxFiles: 10 }, // 5MB
  basic: { maxSize: 25 * 1024 * 1024, maxFiles: 50 }, // 25MB
  plus: { maxSize: 100 * 1024 * 1024, maxFiles: 200 }, // 100MB
  max: { maxSize: 2 * 1024 * 1024 * 1024, maxFiles: 1000 }, // 2GB
};

export const FileUpload = ({ onUploadComplete }: { onUploadComplete?: () => void }) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const planTier = (profile?.plan_tier || 'free') as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[planTier];

  const validateFile = (file: File): string | null => {
    if (file.size > limits.maxSize) {
      return `Datei zu groß (max. ${Math.round(limits.maxSize / 1024 / 1024)}MB für ${planTier}-Plan)`;
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
          folder_id: '00000000-0000-0000-0000-000000000000', // Root folder (placeholder)
          meta: {
            original_name: file.name,
            uploaded_at: new Date().toISOString(),
          },
        });

      if (dbError) throw dbError;

      setUploadFiles(prev => 
        prev.map(f => f.id === id ? { ...f, status: 'success' as const, progress: 100 } : f)
      );

      toast({
        title: 'Upload erfolgreich',
        description: `${file.name} wurde hochgeladen.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      
      setUploadFiles(prev => 
        prev.map(f => f.id === id ? { ...f, status: 'error' as const, error: errorMessage } : f)
      );

      toast({
        title: 'Upload fehlgeschlagen',
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

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status === 'uploading'));
    if (onUploadComplete) onUploadComplete();
  };

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
          {isDragActive ? 'Dateien hier ablegen...' : 'Dateien hochladen'}
        </p>
        <p className="text-sm text-muted-foreground">
          Klicken oder Dateien hierher ziehen (max. {Math.round(limits.maxSize / 1024 / 1024)}MB pro Datei)
        </p>
      </Card>

      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Uploads ({uploadFiles.length})</h3>
            {uploadFiles.some(f => f.status === 'success') && (
              <Button onClick={clearCompleted} variant="ghost" size="sm">
                Erledigte entfernen
              </Button>
            )}
          </div>

          {uploadFiles.map(uploadFile => (
            <Card key={uploadFile.id} className="p-4">
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
                        Hochladen... {uploadFile.progress}%
                      </p>
                    </div>
                  )}

                  {uploadFile.status === 'success' && (
                    <p className="text-xs text-green-600">✓ Erfolgreich hochgeladen</p>
                  )}

                  {uploadFile.status === 'error' && (
                    <p className="text-xs text-destructive">✗ {uploadFile.error}</p>
                  )}

                  {uploadFile.status === 'pending' && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Warten...
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
