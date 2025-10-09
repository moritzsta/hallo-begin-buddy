import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, Loader2 } from 'lucide-react';

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
}

export const ShareLinkDialog = ({
  open,
  onOpenChange,
  fileId,
  fileName,
}: ShareLinkDialogProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: { fileId, expiresInDays: 7 },
      });

      if (error) throw error;

      const url = `${window.location.origin}/share/${data.token}`;
      setShareUrl(url);
      setExpiresAt(data.expiresAt);
      toast.success(t('documents.shareLinkCreated'));
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error(t('documents.shareLinkError'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('documents.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error(t('documents.copyError'));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShareUrl(null);
      setExpiresAt(null);
      setCopied(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('documents.shareLink')}</DialogTitle>
          <DialogDescription>
            {t('documents.shareLinkDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">{t('documents.fileName')}</Label>
            <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
          </div>

          {!shareUrl ? (
            <Button
              onClick={generateShareLink}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('documents.generateLink')}
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="share-url">{t('documents.shareUrl')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {expiresAt && (
                <p className="text-xs text-muted-foreground">
                  {t('documents.linkExpires')}: {new Date(expiresAt).toLocaleString()}
                </p>
              )}
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-xs text-muted-foreground">
                  {t('documents.shareLinkInfo')}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
