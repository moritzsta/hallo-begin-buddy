import { useState, useEffect } from 'react';
import { useFolders } from '@/hooks/useFolders';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Folder, Files } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MoveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string | null;
  currentFolderId: string | null;
}

export function MoveFileDialog({ open, onOpenChange, fileId, currentFolderId }: MoveFileDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { folders } = useFolders();
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);

  useEffect(() => {
    setSelectedFolderId(currentFolderId);
  }, [currentFolderId, open]);

  const moveMutation = useMutation({
    mutationFn: async ({ fileId, folderId }: { fileId: string; folderId: string | null }) => {
      // Get or create root folder if null
      let targetFolderId = folderId;
      if (!targetFolderId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: rootFolder } = await supabase
          .from('folders')
          .select('id')
          .eq('owner_id', user.id)
          .is('parent_id', null)
          .limit(1)
          .single();

        if (rootFolder) {
          targetFolderId = rootFolder.id;
        } else {
          const { data: newRoot, error: folderError } = await supabase
            .from('folders')
            .insert({
              owner_id: user.id,
              name: 'Root',
              parent_id: null,
            })
            .select('id')
            .single();

          if (folderError) throw folderError;
          targetFolderId = newRoot.id;
        }
      }

      const { error } = await supabase
        .from('files')
        .update({ folder_id: targetFolderId })
        .eq('id', fileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        title: t('documents.moveSuccess'),
        description: t('documents.moveSuccessDesc'),
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('documents.moveError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileId) return;

    moveMutation.mutate({ fileId, folderId: selectedFolderId });
  };

  // Build folder tree with indentation
  const buildFolderTree = () => {
    const rootFolders = folders.filter(f => !f.parent_id);
    const tree: { folder: typeof folders[0]; depth: number }[] = [];

    const addChildren = (parentId: string, depth: number) => {
      const children = folders.filter(f => f.parent_id === parentId);
      children.forEach(child => {
        tree.push({ folder: child, depth });
        addChildren(child.id, depth + 1);
      });
    };

    rootFolders.forEach(folder => {
      tree.push({ folder, depth: 0 });
      addChildren(folder.id, 1);
    });

    return tree;
  };

  const folderTree = buildFolderTree();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('documents.moveTitle')}</DialogTitle>
            <DialogDescription>{t('documents.moveDesc')}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            <RadioGroup value={selectedFolderId || 'root'} onValueChange={(v) => setSelectedFolderId(v === 'root' ? null : v)}>
              {/* All Files / Root */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="root" id="root" />
                <Label htmlFor="root" className="flex items-center gap-2 cursor-pointer">
                  <Files className="h-4 w-4" />
                  {t('folders.allFiles')}
                </Label>
              </div>

              {/* Folder tree */}
              {folderTree.map(({ folder, depth }) => (
                <div 
                  key={folder.id} 
                  className="flex items-center space-x-2"
                  style={{ paddingLeft: `${depth * 20}px` }}
                >
                  <RadioGroupItem 
                    value={folder.id} 
                    id={folder.id}
                    disabled={folder.id === currentFolderId}
                  />
                  <Label 
                    htmlFor={folder.id} 
                    className={`flex items-center gap-2 cursor-pointer ${
                      folder.id === currentFolderId ? 'opacity-50' : ''
                    }`}
                  >
                    <Folder className="h-4 w-4" />
                    {folder.name}
                    {folder.id === currentFolderId && (
                      <span className="text-xs text-muted-foreground">({t('documents.currentFolder')})</span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={moveMutation.isPending}>
              {moveMutation.isPending ? t('common.loading') : t('documents.moveFile')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
