import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { FileIcon, Loader2, ImageOff, FileText, Film, FileImage } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ImageLightbox } from './ImageLightbox';

interface DocumentPreviewProps {
  fileId: string;
  fileName: string;
  mimeType: string;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

export function DocumentPreview({ fileId, fileName, mimeType, size = 'md', clickable = false }: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { theme } = useTheme();
  const isLifestyle = theme === 'lifestyle';

  const sizeClasses = {
    sm: isLifestyle ? 'w-14 h-14' : 'w-12 h-12',
    md: isLifestyle ? 'w-20 h-20' : 'w-16 h-16',
    lg: 'w-full h-full', // Full size for modal preview
  };

  const iconSizeClasses = {
    sm: isLifestyle ? 'w-7 h-7' : 'w-6 h-6',
    md: isLifestyle ? 'w-10 h-10' : 'w-8 h-8',
    lg: isLifestyle ? 'w-20 h-20' : 'w-16 h-16',
  };

  const getPastelClass = () => {
    if (!isLifestyle) return '';
    
    if (mimeType.includes('pdf')) return 'bg-pastel-pdf';
    if (mimeType.startsWith('image/')) return 'bg-pastel-image';
    if (mimeType.startsWith('video/')) return 'bg-pastel-video';
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) {
      return 'bg-pastel-doc';
    }
    return 'bg-pastel-other';
  };

  const getFileTypeIcon = () => {
    const iconClass = `${iconSizeClasses[size]} ${isLifestyle ? 'text-primary' : 'text-muted-foreground'}`;
    
    if (mimeType.includes('pdf')) return <FileText className={iconClass} />;
    if (mimeType.startsWith('image/')) return <FileImage className={iconClass} />;
    if (mimeType.startsWith('video/')) return <Film className={iconClass} />;
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) {
      return <FileText className={iconClass} />;
    }
    return <FileIcon className={iconClass} />;
  };

  useEffect(() => {
    // Only generate previews for images
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
          // Silently handle errors - file might have been deleted or is inaccessible
          console.warn('Preview generation failed:', previewError);
          setError(true);
          return;
        }

        // Check for error in response data (edge function returns 500 with error object)
        if (data?.error) {
          console.warn('Preview error response:', data.error);
          setError(true);
          return;
        }

        if (data?.preview_url) {
          setPreviewUrl(data.preview_url);
        } else {
          // No preview URL returned - show fallback icon
          setError(true);
        }
      } catch (err) {
        // Silently handle - component will show fallback icon
        console.warn('Preview error:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [fileId, mimeType]);

  // For images, show thumbnail if available; for PDFs show icon
  if (mimeType.startsWith('image/')) {
    return (
      <>
        <Card 
          className={`
            ${sizeClasses[size]} 
            flex items-center justify-center overflow-hidden
            ${isLifestyle ? 'hover-lift rounded-2xl' : ''}
            ${getPastelClass()}
            ${clickable && previewUrl ? 'cursor-pointer' : ''}
          `}
          onClick={() => {
            if (clickable && previewUrl) {
              setLightboxOpen(true);
            }
          }}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          {error && <ImageOff className={`${iconSizeClasses[size]} text-muted-foreground`} />}
          {!isLoading && !error && previewUrl && (
            <img 
              src={previewUrl} 
              alt={fileName} 
              className={size === 'lg' ? 'w-full h-full object-contain' : 'w-full h-full object-cover'}
            />
          )}
          {!isLoading && !error && !previewUrl && getFileTypeIcon()}
        </Card>
        {clickable && previewUrl && (
          <ImageLightbox
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            imageUrl={previewUrl}
            fileName={fileName}
          />
        )}
      </>
    );
  }

  // For non-images, show file type icon with pastel background in lifestyle mode
  return (
    <Card 
      className={`
        ${sizeClasses[size]} 
        flex items-center justify-center
        ${isLifestyle ? 'hover-lift rounded-2xl' : ''}
        ${getPastelClass()}
      `}
    >
      {getFileTypeIcon()}
    </Card>
  );
}
