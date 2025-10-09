import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TagInput } from './TagInput';

interface EditTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string | null;
  currentTags: string[];
}

export const EditTagsDialog = ({ 
  open, 
  onOpenChange, 
  fileId,
  currentTags 
}: EditTagsDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>(currentTags);

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
    enabled: !!user && open,
  });

  const availableTags = Array.from(
    new Set(
      allFiles?.flatMap(file => file.tags || []) || []
    )
  ).sort();

  // Reset tags when dialog opens with new file
  useEffect(() => {
    if (open) {
      setTags(currentTags);
    }
  }, [open, currentTags]);

  const updateMutation = useMutation({
    mutationFn: async ({ fileId, tags }: { fileId: string; tags: string[] }) => {
      const { error } = await supabase
        .from('files')
        .update({ tags })
        .eq('id', fileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        title: t('tags.updateSuccess'),
        description: t('tags.updateSuccessDesc'),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: t('tags.updateError'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (fileId) {
      updateMutation.mutate({ fileId, tags });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('tags.editTitle')}</DialogTitle>
          <DialogDescription>
            {t('tags.editDesc')}
          </DialogDescription>
        </DialogHeader>

        <TagInput
          tags={tags}
          onTagsChange={setTags}
          suggestions={availableTags}
          placeholder={t('tags.inputPlaceholder')}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};