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
import { Loader2, CheckCircle2, FolderPlus, Edit2, Plus, Minus } from 'lucide-react';
import { TagInput } from '@/components/documents/TagInput';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    suggested_path?: string;
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
  
  // Path editing state
  const initialPath = (suggestedPath || metadata.suggested_path || '').split('/').filter(Boolean);
  const [pathElements, setPathElements] = useState<string[]>(initialPath);
  const [editingPathIndex, setEditingPathIndex] = useState<number | null>(null);
  const [editingPathValue, setEditingPathValue] = useState('');
  const [insertingAtIndex, setInsertingAtIndex] = useState<number | null>(null);
  const [newPathElement, setNewPathElement] = useState('');

  const handleConfirm = async () => {
    // Validate path - remove empty segments
    const validPath = pathElements.filter(el => el.trim() !== '');
    if (validPath.length === 0) {
      return; // Need at least one folder
    }
    
    setIsConfirming(true);
    try {
      const updatedMetadata = {
        title: editedTitle,
        doc_type: editedDocType || undefined,
        date: editedDate || undefined,
        party: editedParty || undefined,
        amount: editedAmount || undefined,
        suggested_path: validPath.join('/'),
      };
      await onConfirm(updatedMetadata, tags);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRemovePathElement = (index: number) => {
    setPathElements(prev => prev.filter((_, i) => i !== index));
  };

  const handleInsertPathElement = (index: number) => {
    if (newPathElement.trim() && pathElements.length < 6) {
      const newElements = [...pathElements];
      newElements.splice(index + 1, 0, newPathElement.trim());
      setPathElements(newElements);
      setNewPathElement('');
      setInsertingAtIndex(null);
    }
  };

  const handleStartEditPathElement = (index: number) => {
    setEditingPathIndex(index);
    setEditingPathValue(pathElements[index]);
  };

  const handleSaveEditPathElement = () => {
    if (editingPathIndex !== null && editingPathValue.trim()) {
      const newElements = [...pathElements];
      newElements[editingPathIndex] = editingPathValue.trim();
      setPathElements(newElements);
      setEditingPathIndex(null);
      setEditingPathValue('');
    }
  };

  const handleCancelEditPathElement = () => {
    setEditingPathIndex(null);
    setEditingPathValue('');
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  // Render editable path with plus/minus controls
  const renderPathPreview = () => {
    return (
      <TooltipProvider>
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-md">
          <span className="text-sm text-muted-foreground">/</span>
          {pathElements.map((part, index) => {
            const isNew = newFolders?.includes(part);
            const isEditing = editingPathIndex === index;
            
            return (
              <div key={index} className="flex items-center gap-1.5">
                {/* Path Element Chip */}
                <div className="flex items-center gap-1.5 bg-background rounded-md px-2 py-1 border">
                  {isNew && <FolderPlus className="h-3.5 w-3.5 text-primary" />}
                  
                  {isEditing ? (
                    <Input
                      value={editingPathValue}
                      onChange={(e) => setEditingPathValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEditPathElement();
                        }
                        if (e.key === 'Escape') {
                          handleCancelEditPathElement();
                        }
                      }}
                      onBlur={handleSaveEditPathElement}
                      className="h-6 w-32 text-sm px-2"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className={`text-sm font-medium cursor-pointer hover:underline ${isNew ? 'text-primary' : 'text-foreground'}`}
                      onClick={() => handleStartEditPathElement(index)}
                    >
                      {part}
                    </span>
                  )}
                  
                  {isNew && (
                    <Badge variant="outline" className="h-5 text-xs border-primary/50 text-primary ml-1">
                      {t('common.new')}
                    </Badge>
                  )}
                  
                  {!isEditing && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemovePathElement(index)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('upload.removePathElement', { defaultValue: 'Pfadelement entfernen' })}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Insert Button after "/" separator */}
                {pathElements.length < 6 && (
                  <Popover 
                    open={insertingAtIndex === index} 
                    onOpenChange={(open) => setInsertingAtIndex(open ? index : null)}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-primary/10"
                          >
                            <Plus className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('upload.insertPathElementAfter', { defaultValue: 'Hier neuen Ordner einfügen' })}</p>
                      </TooltipContent>
                    </Tooltip>
                    <PopoverContent className="w-64" align="start">
                      <div className="flex items-center gap-2">
                        <Input
                          value={newPathElement}
                          onChange={(e) => setNewPathElement(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInsertPathElement(index);
                            }
                            if (e.key === 'Escape') {
                              setInsertingAtIndex(null);
                              setNewPathElement('');
                            }
                          }}
                          placeholder={t('upload.pathElementName', { defaultValue: 'Ordnername...' })}
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          onClick={() => handleInsertPathElement(index)}
                          disabled={!newPathElement.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Separator */}
                <span className="text-sm text-muted-foreground">/</span>
              </div>
            );
          })}
        </div>
      </TooltipProvider>
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
            <p className="text-xs text-muted-foreground italic">
              {t('upload.aiSuggestedPath', { 
                defaultValue: 'Dieser Pfad wurde von der KI basierend auf dem Dokumentinhalt vorgeschlagen.' 
              })}
            </p>
          </div>

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
