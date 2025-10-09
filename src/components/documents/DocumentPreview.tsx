import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileIcon, Loader2, ImageOff } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DocumentPreviewProps {
  fileId: string;
  fileName: string;
  mimeType: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DocumentPreview({ fileId, fileName, mimeType, size = 'md' }: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-32 h-32',
  };

  useEffect(() => {
    if (!mimeType.startsWith('image/')) {
      return;
    }

    const loadPreview = async () => {
      setIsLoading(true);
      setError(false);

      try {
        // Try to generate/get preview
        const { data, error: previewError } = await supabase.functions.invoke('generate-preview', {
          body: { file_id: fileId },
        });

        if (previewError) {
          console.warn('Preview generation failed:', previewError);
          setError(true);
          return;
        }

        if (data?.preview_url) {
          setPreviewUrl(data.preview_url);
        }
      } catch (err) {
        console.warn('Preview error:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [fileId, mimeType]);

  if (!mimeType.startsWith('image/')) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center bg-muted rounded`}>
        <FileIcon className="h-1/2 w-1/2 text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center bg-muted rounded`}>
        <Loader2 className="h-1/3 w-1/3 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error || !previewUrl) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center bg-muted rounded`}>
        <ImageOff className="h-1/2 w-1/2 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className={`${sizeClasses[size]} overflow-hidden p-0 border-2`}>
      <img
        src={previewUrl}
        alt={fileName}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </Card>
  );
}
