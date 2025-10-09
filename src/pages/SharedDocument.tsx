import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileX, AlertCircle } from 'lucide-react';
import { DocumentViewer } from '@/components/viewer/DocumentViewer';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface SharedFileData {
  file: {
    id: string;
    title: string;
    mime: string;
    size: number;
    created_at: string;
  };
  signedUrl: string;
  previewUrl: string | null;
  expiresAt: string | null;
}

export default function SharedDocument() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<SharedFileData | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    fetchSharedFile();
  }, [token]);

  const fetchSharedFile = async () => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('get-shared-file', {
        body: { token },
      });

      if (fetchError) {
        console.error('Error fetching shared file:', fetchError);
        setError(fetchError.message || 'Failed to load shared file');
        return;
      }

      setFileData(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load shared file');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('documents.loadingSharedFile')}</p>
        </div>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          {error?.includes('expired') ? (
            <>
              <AlertCircle className="h-16 w-16 mx-auto text-yellow-600" />
              <h1 className="text-2xl font-bold">{t('documents.linkExpiredTitle')}</h1>
              <p className="text-muted-foreground">{t('documents.linkExpiredMessage')}</p>
            </>
          ) : (
            <>
              <FileX className="h-16 w-16 mx-auto text-destructive" />
              <h1 className="text-2xl font-bold">{t('documents.fileNotFound')}</h1>
              <p className="text-muted-foreground">{error || t('documents.fileNotFoundMessage')}</p>
            </>
          )}
          <Button onClick={() => navigate('/')} variant="outline">
            {t('common.goToHome')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{fileData.file.title}</h1>
              <p className="text-sm text-muted-foreground">
                {t('documents.sharedReadOnly')}
                {fileData.expiresAt && (
                  <> • {t('documents.linkExpires')}: {new Date(fileData.expiresAt).toLocaleDateString()}</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4">
        <DocumentViewer
          fileId={fileData.file.id}
          fileName={fileData.file.title}
          mimeType={fileData.file.mime}
          onClose={() => navigate('/')}
        />
      </div>
    </div>
  );
}
