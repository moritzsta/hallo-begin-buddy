import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, FolderPlus, Edit2 } from 'lucide-react';
import { TagInput } from '@/components/documents/TagInput';

interface MetadataConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: {
    title: string;
    doc_type?: string;
    date?: string;
    party?: string;
    amount?: string;
    keywords?: string[];
  };
  suggestedPath?: string;
  newFolders?: string[];
  onConfirm: (updatedMetadata: any, tags: string[]) => Promise<void>;
  onCancel: () => void;
  fileName: string;
  availableTags?: string[];
}

export const MetadataConfirmDialog = ({
  open,
  onOpenChange,
  metadata,
  suggestedPath,
  newFolders = [],
  onConfirm,
  onCancel,
  fileName,
  availableTags = [],
}: MetadataConfirmDialogProps) => {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable metadata state with safe defaults
  const [editedTitle, setEditedTitle] = useState(metadata.title || fileName || '');
  const [editedDocType, setEditedDocType] = useState(metadata.doc_type || '');
  const [editedDate, setEditedDate] = useState(metadata.date || '');
  const [editedParty, setEditedParty] = useState(metadata.party || '');
  const [editedAmount, setEditedAmount] = useState(metadata.amount || '');
  const [tags, setTags] = useState<string[]>(metadata.keywords || []);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const updatedMetadata = {
        title: editedTitle,
        doc_type: editedDocType || undefined,
        date: editedDate || undefined,
        party: editedParty || undefined,
        amount: editedAmount || undefined,
      };
      await onConfirm(updatedMetadata, tags);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  // Render path with badges for new folders
  const renderPathPreview = () => {
    if (!suggestedPath) return null;

    const pathParts = suggestedPath.split('/').filter(Boolean);
    
    return (
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-md">
        <span className="text-sm text-muted-foreground">/</span>
        {pathParts.map((part, index) => {
          const isNew = newFolders?.includes(part);
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {isNew && <FolderPlus className="h-3.5 w-3.5 text-primary" />}
                <span className={`text-sm font-medium ${isNew ? 'text-primary' : 'text-foreground'}`}>
                  {part}
                </span>
                {isNew && (
                  <Badge variant="outline" className="h-5 text-xs border-primary/50 text-primary">
                    {t('common.new')}
                  </Badge>
                )}
              </div>
              {index < pathParts.length - 1 && (
                <span className="text-sm text-muted-foreground">/</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {t('upload.confirmMetadata', { defaultValue: 'Metadaten bestätigen' })}
          </DialogTitle>
          <DialogDescription>
            {t('upload.confirmMetadataDesc', { 
              fileName,
              defaultValue: 'Überprüfen Sie die extrahierten Metadaten für {{fileName}} und passen Sie sie bei Bedarf an.' 
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Path Preview */}
          {suggestedPath && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('upload.suggestedPath', { defaultValue: 'Vorgeschlagener Ablageort' })}
              </Label>
              {renderPathPreview()}
              {newFolders && newFolders.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('upload.newFoldersWillBeCreated', { 
                    count: newFolders.length,
                    defaultValue: '{{count}} neue(r) Ordner wird/werden erstellt' 
                  })}
                </p>
              )}
            </div>
          )}

          {/* Edit Toggle */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-sm font-medium">
              {t('upload.extractedMetadata', { defaultValue: 'Extrahierte Metadaten' })}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              {isEditing ? t('common.view') : t('common.edit')}
            </Button>
          </div>

          {/* Metadata Display/Edit */}
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="title">{t('documents.title')}</Label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder={t('documents.title')}
                />
              </div>

              {editedDocType && (
                <div className="space-y-1.5">
                  <Label htmlFor="docType">{t('documents.docType', { defaultValue: 'Dokumenttyp' })}</Label>
                  <Input
                    id="docType"
                    value={editedDocType}
                    onChange={(e) => setEditedDocType(e.target.value)}
                    placeholder={t('documents.docType')}
                  />
                </div>
              )}

              {editedDate && (
                <div className="space-y-1.5">
                  <Label htmlFor="date">{t('documents.date')}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                  />
                </div>
              )}

              {editedParty && (
                <div className="space-y-1.5">
                  <Label htmlFor="party">{t('documents.party', { defaultValue: 'Partei/Absender' })}</Label>
                  <Input
                    id="party"
                    value={editedParty}
                    onChange={(e) => setEditedParty(e.target.value)}
                    placeholder={t('documents.party')}
                  />
                </div>
              )}

              {editedAmount && (
                <div className="space-y-1.5">
                  <Label htmlFor="amount">{t('documents.amount', { defaultValue: 'Betrag' })}</Label>
                  <Input
                    id="amount"
                    value={editedAmount}
                    onChange={(e) => setEditedAmount(e.target.value)}
                    placeholder={t('documents.amount')}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-muted/30 rounded-md">
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="font-medium text-muted-foreground">{t('documents.title')}:</span>
                <span className="text-foreground">{editedTitle}</span>
                
                {editedDocType && (
                  <>
                    <span className="font-medium text-muted-foreground">
                      {t('documents.docType', { defaultValue: 'Dokumenttyp' })}:
                    </span>
                    <span className="text-foreground">{editedDocType}</span>
                  </>
                )}

                {editedDate && (
                  <>
                    <span className="font-medium text-muted-foreground">{t('documents.date')}:</span>
                    <span className="text-foreground">{editedDate}</span>
                  </>
                )}

                {editedParty && (
                  <>
                    <span className="font-medium text-muted-foreground">
                      {t('documents.party', { defaultValue: 'Partei' })}:
                    </span>
                    <span className="text-foreground">{editedParty}</span>
                  </>
                )}

                {editedAmount && (
                  <>
                    <span className="font-medium text-muted-foreground">
                      {t('documents.amount', { defaultValue: 'Betrag' })}:
                    </span>
                    <span className="text-foreground">{editedAmount}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2 pt-2 border-t">
            <Label>{t('tags.tags')}</Label>
            <TagInput
              tags={tags}
              onTagsChange={setTags}
              suggestions={availableTags}
              placeholder={t('tags.addTags')}
              maxTags={10}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isConfirming}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || !editedTitle.trim()}
          >
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('upload.confirmAndSave', { defaultValue: 'Bestätigen & Ablegen' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
